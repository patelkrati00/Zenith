import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
    console.log("----------- AUTH DEBUG -----------");

    console.log("JWT_SECRET in middleware:", process.env.JWT_SECRET);
    console.log("AUTH HEADER RECEIVED:", req.headers.authorization);

    if (process.env.DISABLE_AUTH === 'true') {
        req.user = { id: 'anonymous', username: 'anonymous', role: 'user' };
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("NO TOKEN PROVIDED");
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    console.log("TOKEN RECEIVED:", token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("DECODED PAYLOAD:", decoded);

        req.user = decoded;
        next();
    } catch (err) {
        console.log("JWT VERIFY ERROR:", err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admins only' });
    }
    next();
}
