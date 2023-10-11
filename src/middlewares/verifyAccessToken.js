import jwt from "jsonwebtoken";

const verifyAccessToken = async (req, res, next) => {
  const { accessToken } = req.cookies;

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default verifyAccessToken;
