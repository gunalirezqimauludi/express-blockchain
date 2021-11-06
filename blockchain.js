const crypto = require('crypto');
const urlparse = require('url-parse');
const axios = require('axios');

class Blockchain {

    nodes;
    chain;
    currentTransactions;
    difficultyTarget = "0000";

    constructor()
    {
        this.nodes = [];
        this.chain = [];
        this.currentTransactions = [];
        
        const genesisHash = this.hashBlock("genesis_block");
        this.appendBlock(this.proofOfWork(0, genesisHash, []), genesisHash);
    }

    hashBlock(block)
    {
        const blockEncoded = JSON.stringify(block);
        return crypto.createHash('sha256').update(blockEncoded).digest('hex');
    }
    
    proofOfWork(index, hashOfPreviousBlock, transactions)
    {
        let nonce = 0;
        
        while (this.validProof(index, hashOfPreviousBlock, transactions, nonce) === false) {
            nonce += 1;
        }

        return nonce;
    }

    validProof(index, hashOfPreviousBlock, transactions, nonce)
    {
        const content = JSON.stringify(`${index}${hashOfPreviousBlock}${transactions}${nonce}`);
        const contentHash = crypto.createHash('sha256').update(content).digest('hex');

        return contentHash.substring(0, this.difficultyTarget.length) == this.difficultyTarget;
    }

    appendBlock(nonce, hashOfPreviousBlock)
    {
        const block = {
            'index' : this.chain.length,
            'timestamp': Date.now(),
            'transactions': this.currentTransactions,
            'nonce': nonce,
            'hash_of_previous_block': hashOfPreviousBlock
        }

        this.currentTransactions = [];
        this.chain.push(block);

        return block;
    }

    addTransaction(sender, receipent, amount)
    {
        this.currentTransactions.push({
            'sender': sender,
            'receipent': receipent,
            'amount': amount,
        });

        return this.lastBlock()['index'] + 1;
    }

    lastBlock()
    {
        return this.chain[this.chain.length - 1];
    }

    addNode(address)
    {
        const parseURL = urlparse('host', address);
        this.nodes.push(parseURL['host']);
    }

    updateBlockchain()
    {
        const neighbours = this.nodes;
        let newChain = undefined;
        let maxLenght = this.chain.length;

        neighbours.map((node) => {
            axios.get(`http://${node}/blockchain`)
            .then((res) => {
                const length = res.data.length;
                const chain = res.data.chain;

                if (length > maxLenght && this.validChain(chain)) {
                    maxLenght = length;
                    newChain = chain;
                }
                    
                if (newChain) {
                    this.chain = newChain
                    return true;
                }
            });
        });

        return false;
    }

    validChain(chain)
    {
        let lastBlock = chain[0];
        let currentIndex = 1;

        while (currentIndex < chain.length) {
            const block = chain[currentIndex];

            if (block['hash_of_previous_block'] != this.hashBlock(lastBlock)) {
                return false
            }
                
            if (!this.validProof(currentIndex, block['hash_of_previous_block'], block['transactions'], block['nonce'])) {
                return false;
            }

            lastBlock = block;
            currentIndex += 1;
        }   

        return true;
    }
}

module.exports = Blockchain;