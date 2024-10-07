import jwt from 'jsonwebtoken'

export const isAuthenticated = async (req, resp, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return resp.status(401).json({
                message: "User Not authenticated",
                success: false
            })
        };

        const decode = jwt.verify(token, process.env.SECRET_KEY)
        if (!decode) {
            return resp.status(401).json({
                message: "invalid token",
                success: false
            })
        }
        req.id = decode.userId
        next()
    } catch (error) {
        console.log(error);

    }
}