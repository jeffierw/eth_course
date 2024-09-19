// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InsertSort {
    function sort(uint[] memory arr) public pure returns (uint[] memory) {
        for (uint i = 1; i < arr.length; i++) {
            uint key = arr[i];
            int j = int(i) - 1;
            
            while (j >= 0 && arr[uint(j)] > key) {
                arr[uint(j + 1)] = arr[uint(j)];
                j--;
            }
            arr[uint(j + 1)] = key;
        }
        return arr;
    }
}