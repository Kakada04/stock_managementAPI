// src/middleware/auth.ts
// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { User } from '../Models/User';

// const JWT_SECRET = process.env.JWT_SECRET || 'stock_management_secret_2024';

// Protect routes (must be logged in)
// export const protect = async (req: Request, res: Response, next: NextFunction) => {
//   let token;

//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       token = req.headers.authorization.split(' ')[1];
//       const decoded: any = jwt.verify(token, JWT_SECRET);

//       // Add user info to request
//       (req as any).user = await User.findById(decoded.id).select('-password');
//       next();
//     } catch (error) {
//       res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   } else {
//     res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };

// Restrict to specific roles
// export const authorizeRoles = (...roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!roles.includes((req as any).user.role)) {
//       return res.status(403).json({ message: 'You do not have permission to perform this action' });
//     }
//     next();
//   };
// };





// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../Models/User';
import { IUser } from '../Models/User'; // if you have an interface

const JWT_SECRET = process.env.JWT_SECRET || 'stock_management_secret_2024';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: Omit<IUser, 'password'>; // user without password
}

// ✅ Protect routes (must be logged in)
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      // Attach user to request
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// ✅ Restrict access to specific roles
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};
