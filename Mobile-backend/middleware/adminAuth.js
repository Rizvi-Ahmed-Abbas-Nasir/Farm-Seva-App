import jwt from "jsonwebtoken";

export const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin")
      return res.status(403).json({ error: "Admin access only" });

    req.adminId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
