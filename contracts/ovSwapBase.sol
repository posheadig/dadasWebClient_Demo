// SPDX-License-Identifier: MIT
pragma solidity =0.8.21;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract ovSwapBase {
    IUniswapV2Router02 public immutable uniswapV2Router;

    event TokensPurchased(address indexed buyer, address indexed tokenAddress, uint256 amountOut, uint256 ethSpent);
    event TokensSold(address indexed seller, address indexed tokenAddress, uint256 amountIn, uint256 ethReceived);

    constructor() {
        uniswapV2Router = IUniswapV2Router02(0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008);
    }

    function buyExactTokenWithETH(address tokenAddress, uint256 amountOutMin, uint256 deadline) external payable {
        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = tokenAddress;

        uint256[] memory amounts = uniswapV2Router.swapETHForExactTokens{value: msg.value}(
            amountOutMin,
            path,
            msg.sender,
            deadline
        );

        emit TokensPurchased(msg.sender, tokenAddress, amounts[1], amounts[0]);
    }

    function sellExactTokenForETH(address tokenAddress, uint256 amountIn, uint256 amountOutMin, uint256 deadline) external {
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = uniswapV2Router.WETH();

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenAddress).approve(address(uniswapV2Router), amountIn);

        uint256[] memory amounts = uniswapV2Router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            path,
            msg.sender,
            deadline
        );

        emit TokensSold(msg.sender, tokenAddress, amounts[0], amounts[1]);
    }


}