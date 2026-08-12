import jwt from "jsonwebtoken";
import "dotenv/config";

export function identifyUser(req, res, next) {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Missing token",
        });
    }

    try {
        const token = header.slice(7);

        const publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

        req.user = jwt.verify(
            token,
            publicKey,
            {
                algorithms: ["RS256"],
            }
        );

        next();
    } catch (error) {
        console.error("JWT verification error:", error.message);

        return res.status(401).json({
            error: "Invalid token",
        });
    }
}