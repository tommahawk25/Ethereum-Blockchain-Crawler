const Web3 = require("web3");
const EthDater = require("ethereum-block-by-date");
const fetch = require("node-fetch");

//Get transaction data for address starting from given block
$("#resultTransactions").on("click", function(){
    async function getTransactions(){   
        let address = $("#inputAddress").val();
        let startBlock = $("#inputBlock").val();
        await fetch("https://api.etherscan.io/api?module=account&action=txlist&address="+address+"&startblock="+startBlock+"&endblock=99999999&page=1&offset=10000&sort=asc&apikey=H3482MS4S9QZHQBCIT65PQ5JU1A8TFSPFD")
            .then(res => res.json())
            .then(data => {
                let output = "<h4>Result:</h4>";
                data.result.forEach(function(transaction){
                    output += `
                        <ul class="list-group" mb-3>
                            <li class="list-group-item"><b>Address from: </b>${transaction.from}</li>
                            <li class="list-group-item"><b>Address to: </b>${transaction.to}</li>
                            <li class="list-group-item"><b>ETH used for transaction: </b>${transaction.gasUsed*transaction.gasPrice/1000000000000000000}</li>
                            <br>
                        </ul>
                    `;
                });
                document.getElementById("outputTransactions").innerHTML = output;
            })
            .catch((err) => console.log(err))
    }
    getTransactions()
})

//Get historical ETH and ERC20 tokens balance for given address and date
$("#resultBalanceEth").on("click", function(){
    async function getBalance(){
        let address2 = $("#inputAddress2").val();
        let date2 = $("#inputDate2").val();
        this.web3 = new Web3(new Web3.providers.HttpProvider("https://speedy-nodes-nyc.moralis.io/b33d075c68296226f59db57b/eth/mainnet/archive"));
        this.dater = new EthDater(this.web3);
    //Get ETH historical balance
        //search for block by date
        let blockByDate = await this.dater.getDate(date2 + "T00:00:00Z", true);
        //get balance and display it in ETH
        let balance = await this.web3.eth.getBalance(address2, blockByDate.block);
        let balanceEth = await this.web3.utils.fromWei(balance, "ether");
        //display results
        document.getElementById("outputBalance").innerHTML = `<h4>Result:</h4><b>ETH balance: </b>`+(balanceEth);

    //Get ERC20 tokens balance
        //Get all ERC20 tokens for address
        await fetch("https://api.etherscan.io/api?module=account&action=tokentx&address="+address2+"&page=1&offset=100&sort=asc&apikey=H3482MS4S9QZHQBCIT65PQ5JU1A8TFSPFD")
        .then(res => res.json())
        .then(data => {
            //ABI to get ERC20 Token balance
            let abi = [
                // balanceOf
                {
                "constant":true,
                "inputs":[{"name":"_owner","type":"address"}],
                "name":"balanceOf",
                "outputs":[{"name":"balance","type":"uint256"}],
                "type":"function"
                },
                // decimals
                {
                "constant":true,
                "inputs":[],
                "name":"decimals",
                "outputs":[{"name":"","type":"uint8"}],
                "type":"function"
                }
            ];

            //create array where I save already found token addresses and compare every next token address with array in order to reduce duplicity
            let array = [];

            for (let i=0;i<data.result.length;i++){   
                //reduce duplicated values
                if(array.includes(data.result[i].contractAddress)){
                    //do nothing
                }
                else {
                    //save token address
                    array.push(data.result[i].contractAddress);        
                    //function to get token balance by block
                    let tokenContract = new this.web3.eth.Contract(abi, data.result[i].contractAddress);
                    //need to create async function, otherwise can't use balanceOf() with await
                    async function getBalance() {
                        let tokenBalance = await tokenContract.methods.balanceOf(address2).call({}, blockByDate.block);
                        return tokenBalance;
                    }

                    //run function to get result
                    getBalance().then(function (result) {
                        //unit conversion
                        let tokenBalance2 = result/(10**(data.result[i].tokenDecimal));
                        //display result
                        document.getElementById("outputBalance").innerHTML += `<br><b>`+data.result[i].tokenSymbol+` balance: </b>`+tokenBalance2;
                    });
                }            
            }
        })
        .catch((err) => console.log(err))

    }
    getBalance();
})