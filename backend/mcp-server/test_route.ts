import express from 'express';

const app = express();

app.all('/api/*path', (req, res) => {
    res.json({ path: req.params.path });
});

app.listen(3002, () => console.log('Test server running on 3002'));
