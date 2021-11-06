const express = require('express');
const app = express();
const port = process.argv[2];

const uuid = require('uuid4');
const nodeIdentifier = uuid().replace(/-/g, '');
const { hasAllProperties } = require('./utils');

const Blockchain = require('./blockchain');
const { json } = require('express');
const blockchain = new Blockchain();

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.get('/', function (_, res) {
    res.send('ExpressJS Blockchain!');
})

app.get('/blockchain', (_, res) => {
    const response = {
        'chain': blockchain.chain,
        'length': blockchain.chain.length
    }

    res.json(response);
});

app.get('/mine', (_, res) => {
    blockchain.addTransaction("0", nodeIdentifier, 1);
    
    const lastBlockHash = blockchain.hashBlock(blockchain.lastBlock())
    const index = blockchain.chain.length;
    const nonce = blockchain.proofOfWork(index, lastBlockHash, blockchain.currentTransactions)
    const block = blockchain.appendBlock(nonce, lastBlockHash);

    const response = {
        'message': 'New block has been added (mined)',
        'index': block['index'],
        'hash_of_previous_black': block['hash_of_previous_black'],
        'transactions': block['transactions'],
        'nonce': block['nonce'],
    }

    res.json(response);
});

app.post('/transactions/add_transaction', (req, res) => {
    const payload = req.body;
    const requiredFields = ['sender', 'receipent', 'amount'];

    if (!hasAllProperties(payload, requiredFields)) {
        res.send('Missing fields');
    }

    const index = blockchain.addTransaction(
        payload['sender'],
        payload['receipent'],
        payload['amount'],
    )

    const response = {
        'message': `The transaction will be added to the block ${index}`
    }

    res.json(response);
});

app.post('/nodes/add_node', (req, res) => {
    const payload = req.body;
    const nodes = payload['nodes'];
    
    if (nodes == '') {
        const response = {
            'message': 'Error, missing node(s) info'
        }

        res.json(response);
    }

    nodes.map((node) => {
        blockchain.addNode(node);
    });

    response = {
        'message': 'New node has been added',
        'nodes': blockchain.nodes
    }

    res.json(response);
});

app.get('/nodes/sync', (req, res) => {
    const update = blockchain.updateBlockchain()
    if (update) {
        const response = {
            'message': 'Blockchain has been updated with the latest data',
            'blockchain': blockchain.chain
        }

        res.json(response);
    } else {
        const response = {
            'message': 'Blockchain already uses the most recent data',
            'blockchain': blockchain.chain
        }

        res.json(response);
    }
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});