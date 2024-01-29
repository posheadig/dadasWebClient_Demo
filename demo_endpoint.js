const express = require('express');
const swaggerUi = require('swagger-ui-express');
const fetch = require('node-fetch'); // You'll need to install node-fetch if you haven't already
const {
   ethers
} = require('ethers'); // Make sure you have ethers.js installed

const app = express();
const port = 3000;


const ETH_ADDRESS = "0x7b79995e5f793a07bc00c21412e50ecae098e7f9";

function processTokenData(token, pairs) {
   // Find the corresponding ETH pair for this token
   const ethPair = pairs.find(p => (p.token0 === token.id || p.token1 === token.id) && (p.token0 === ETH_ADDRESS || p.token1 === ETH_ADDRESS));
   let currentPrice = 0;
   if (ethPair) {
      const ethReserve = ethPair.token0 === ETH_ADDRESS ? ethPair.reserve0 : ethPair.reserve1;
      const tokenReserve = ethPair.token0 === ETH_ADDRESS ? ethPair.reserve1 : ethPair.reserve0;
      currentPrice = parseFloat(ethers.utils.formatEther(ethReserve)) / parseFloat(ethers.utils.formatEther(tokenReserve));
   }

   return {
      id: token.id,
      name: token.name,
      rank: currentPrice
   };
}

function processPairData(pair, tokenPrices) {
   const token0Price = tokenPrices[pair.token0] || 0;
   const token1Price = tokenPrices[pair.token1] || 0;
   const token0ReserveInEth = parseFloat(ethers.utils.formatEther(pair.reserve0)) * token0Price;
   const token1ReserveInEth = parseFloat(ethers.utils.formatEther(pair.reserve1)) * token1Price;
   const totalValue = token0ReserveInEth + token1ReserveInEth;

   return {
      linkId: pair.id,
      article0Id: pair.token0,
      article1Id: pair.token1,
      article0Name: pair.token0Name,
      article1Name: pair.token1Name,
      article0Reserve: ethers.utils.formatEther(pair.reserve0),
      article1Reserve: ethers.utils.formatEther(pair.reserve1),
      linkValue: totalValue
   };
}

function processData(tokens, pairs) {
   const ethPairs = pairs.filter(p => p.token0 === ETH_ADDRESS || p.token1 === ETH_ADDRESS);
   const processedTokens = tokens.map(token => processTokenData(token, ethPairs));
   const tokenPrices = processedTokens.reduce((acc, token) => {
      acc[token.id] = token.rank; // Changed from currentPrice to rank
      return acc;
   }, {});

   const nonEthPairs = pairs.filter(p => p.token0 !== ETH_ADDRESS && p.token1 !== ETH_ADDRESS);
   const processedPairs = nonEthPairs.map(pair => processPairData(pair, tokenPrices));

   return {
      articles: processedTokens,
      links: processedPairs
   };
}

// Endpoint to fetch pairs data
app.get('/fetchData', async (req, res) => {
   const pairsQuery = `
    query MyQuery {
      tokens(first: 10) {
        id
        name
        address
      }
      pairs(first: 10) {
        id
        token0
        token1
        address
        token1Name
        token0Name
        reserve1
        reserve0
      }
    }`;

   try {
      const response = await fetch('https://api.studio.thegraph.com/proxy/53594/dadastest/v0.3.6', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
         },
         body: JSON.stringify({
            query: pairsQuery
         })
      });

      if (!response.ok) {
         throw new Error(`HTTP Error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.errors) {
         throw new Error(`GraphQL Error: ${data.errors.map(e => e.message).join('\n')}`);
      }

      // Process tokens and pairs
      const processedData = processData(data.data.tokens, data.data.pairs);

      // Return processed data
      res.status(200).json(processedData);

   } catch (error) {
      console.error('Fetch Error:', error);
      res.status(500).json({
         message: 'Internal server error'
      });
   }
});


// OpenAPI (Swagger) spec
const swaggerDocument = {
   openapi: '3.0.0',
   info: {
      title: 'Articles and Link Data API',
      version: '1.0.0',
      description: 'API for fetching articles and links data',
   },
   servers: [{
      url: 'http://localhost:3000',
      description: 'Local server',
   }, ],
   paths: {
      '/fetchData': {
         get: {
            summary: 'Fetches articles and data',
            operationId: 'fetchData',
            responses: {
               '200': {
                  description: 'A list of articles and links',
                  content: {
                     'application/json': {
                        schema: {
                           type: 'object',
                           properties: {
                              articles: {
                                 type: 'array',
                                 items: {
                                    $ref: '#/components/schemas/Articles',
                                 },
                              },
                              links: {
                                 type: 'array',
                                 items: {
                                    $ref: '#/components/schemas/Links',
                                 },
                              },
                           },
                        },
                     },
                  },
               },
            },
         },
      },
   },
   components: {
      schemas: {
         Articles: {
            type: 'object',
            properties: {
               id: {
                  type: 'string',
               },
               name: {
                  type: 'string',
               },
               rank: {
                  type: 'number',
               },
            },
         },
         Links: {
            type: 'object',
            properties: {
               linkId: {
                  type: 'string',
               },
               article0Id: {
                  type: 'string',
               },
               article1Id: {
                  type: 'string',
               },
               article1Name: {
                  type: 'string',
               },
               article1Name: {
                  type: 'string',
               },
               article0Reserve: {
                  type: 'string',
               },
               article1Reserve: {
                  type: 'string',
               },
               linkValue: {
                  type: 'number',
               },
            },
         },
      },
   },
};

// Use the Swagger UI to serve the OpenAPI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoint to fetch pairs data
app.get('/fetchData', async (req, res) => {

   res.status(200).json({
      message: 'This is where the article and link data would be returned after processing.',
   });
});

app.listen(port, () => {
   console.log(`Server is running at http://localhost:${port}`);
});