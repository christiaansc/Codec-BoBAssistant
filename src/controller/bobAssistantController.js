
const { processDecryptedPayload } = require('../BobPayloadProcessor');

exports.getResponseBobAssistant = async (req, res) => {
    const { payload } = req.params;

    if (!payload) return res.status(400).json({ error: 'Missing payload' });
    try {
        const reportMessage = processDecryptedPayload(payload);
        return res.status(200).json(reportMessage);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}