const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Blockchain = require('./blockchain');
const app = express();

const groceryList = new Blockchain();

const PORT = process.argv[2];
const nodeAddress = uuidv4().split('-').join('');

// Middleware...
app.use(express.json());

app.get('/api/blockchain', (req, res) => {
  res.status(200).json({ success: true, data: groceryList });
});

app.post('/api/grocery', (req, res) => {
  const { item, quantity } = req.body;
  const transaction = groceryList.addTransaction(item, quantity);
  const index = groceryList.addTransactionToPendingList(transaction);

  res.status(201).json({ success: true, data: index });
});

app.post('/api/grocery/broadcast', (req, res) => {
  const { item, quantity } = req.body;
  const transaction = groceryList.addTransaction(item, quantity);
  groceryList.addTransactionToPendingList(transaction);

  groceryList.networkNodes.forEach(async (url) => {
    await axios.post(`${url}/api/grocery`, transaction);
  });

  res.status(201).json({ success: true, data: 'Grocery items added and updated.' });
});

app.get('/api/mine', async (req, res) => {
  const previousBlock = groceryList.getLastBlock();
  const previousHash = previousBlock.hash;
  const data = {
    data: groceryList.pendingList,
    index: previousBlock.index + 1,
  };
  const nonce = groceryList.proofOfWork(previousHash, data);
  const hash = groceryList.createHash(previousHash, data, nonce);

  const block = groceryList.createBlock(nonce, previousHash, hash);

  groceryList.networkNodes.forEach(async (url) => {
    await axios.post(`${url}/api/block`, { block: block });
  });

  await axios.post(`${groceryList.nodeUrl}/api/grocery/broadcast`, { item: 'eggs', quantity: 1 });

  res.status(200).json({
    success: true,
    data: block,
  });
});

app.post('/api/block', (req, res) => {
  const block = req.body.block;
  const lastBlock = groceryList.getLastBlock();
  const hashIsCorrect = lastBlock.hash === block.previousHash;
  const hasCorrectIndex = lastBlock.index + 1 === block.index;

  if (hashIsCorrect && hasCorrectIndex) {
    groceryList.chain.push(block);
    groceryList.pendingList = [];
    res.status(201).json({ success: true, errorMessage: 'Blocket är inte godkänt', data: block });
  } else {
    res.status(400).json({ success: false, data: 'Block är inte godkänt' });
  }
});

// Administrativa endpoints...
// Registrera och synkronisera ny nod med alla noder...
app.post('/api/register-broadcast-node', async (req, res) => {
  const urlToAdd = req.body.nodeUrl;

  if (groceryList.networkNodes.indexOf(urlToAdd) === -1) {
    groceryList.networkNodes.push(urlToAdd);
  }

  groceryList.networkNodes.forEach(async (url) => {
    const body = { nodeUrl: urlToAdd };

    await fetch(`${url}/api/register-node`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const body = { nodes: [...groceryList.networkNodes, groceryList.nodeUrl] };

  await fetch(`${urlToAdd}/api/register-nodes`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  res.status(201).json({ success: true, data: 'Ny nod tillagd' });
});

// Registrera enskild node
app.post('/api/register-node', (req, res) => {
  const url = req.body.nodeUrl;
  console.log('register-node', url);

  if (groceryList.networkNodes.indexOf(url) === -1 && groceryList.nodeUrl !== url) {
    groceryList.networkNodes.push(url);
  }

  res.status(201).json({ success: true, data: 'Ny nod tillagd' });
});

app.post('/api/register-nodes', (req, res) => {
  const allNodes = req.body.nodes;

  allNodes.forEach((url) => {
    if (groceryList.networkNodes.indexOf(url) === -1 && groceryList.nodeUrl !== url) {
      groceryList.networkNodes.push(url);
    }
  });

  res.status(201).json({ success: true, data: 'Nya noder tillagda' });
});

/* CONSENSUS ENDPOINT */
app.get('/api/consensus', (req, res) => {
  const currentChainLength = groceryList.chain.length;
  let maxLength = currentChainLength;
  let longestChain = null;
  let pendingList = null;

  // Iterera igenom alla noder i nätverket som finns upplagda på aktuell node...
  groceryList.networkNodes.forEach((node) => {
    console.log('Node: ', node);

    axios(`${node}/api/blockchain`).then((data) => {
      console.log('Data ifrån axios: ', data);

      if (data.data.data.chain.length > maxLength) {
        maxLength = data.data.data.chain.length;
        longestChain = data.data.data.chain;
        pendingList = data.data.data.pendingList;
      }

      if (!longestChain || (longestChain && !groceryList.validateChain(longestChain))) {
        console.log('No replacement needed');
      } else {
        groceryList.chain = longestChain;
        groceryList.pendingList = pendingList;
        res.status(200).json({ success: true, data: groceryList });
      }
    });
  });
});

app.get('/api/block/:hash', (req, res) => {
  const block = groceryList.findBlock(req.params.hash);
  if (!block) {
    res.status(404).json({ status: 404, success: false, message: 'Ooops kunde inte hitta blocket' });
  } else {
    res.status(200).json({ success: true, data: block });
  }
});

app.get('/api/transaction/:id', (req, res) => {
  const result = groceryList.findTransaction(req.params.id);
  if (!result) {
    res.status(404).json({ status: 404, success: false, message: 'Ooops kunde inte hitta transaktionen' });
  } else {
    res.status(200).json({ success: true, data: result });
  }
});

// app.get('/api/transactions/:address', (req, res) => {
//   const result = groceryList.listTransactions(req.params.address);
//   res.status(200).json({ success: true, data: result });
// });

app.get('/api/transactions/:address', (req, res) => {
  const result = groceryList.listTransactions(req.params.address);
  res.status(200).json({ success: true, data: result.transactions });
});

app.get('/api/transactions/funds/:address', (req, res) => {
  const result = groceryList.listTransactions(req.params.address);
  res.status(200).json({ success: true, data: result.balance });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
