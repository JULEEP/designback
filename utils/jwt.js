import jwt from "jsonwebtoken";

const SECRET = "YOUR_SECRET_KEY";

export const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};
