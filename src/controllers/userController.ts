import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../types/auth';

export const getKnownUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { authorUsername: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const select = {
      authorId: true as const,
      authorUsername: true as const,
      authorName: true as const,
    };

    const [productAuthors, orderAuthors] = await Promise.all([
      prisma.productComment.findMany({
        where,
        select,
        distinct: ['authorId'],
        orderBy: { authorName: 'asc' },
        take: 20,
      }),
      prisma.orderComment.findMany({
        where,
        select,
        distinct: ['authorId'],
        orderBy: { authorName: 'asc' },
        take: 20,
      }),
    ]);

    // Merge and deduplicate
    const seen = new Set<string>();
    const users: typeof productAuthors = [];
    for (const u of [...productAuthors, ...orderAuthors]) {
      if (!seen.has(u.authorId)) {
        seen.add(u.authorId);
        users.push(u);
      }
    }
    users.sort((a, b) => a.authorName.localeCompare(b.authorName));

    const currentUser = {
      authorId: req.user.id,
      authorUsername: req.user.username,
      authorName: req.user.fullName || req.user.username,
    };

    const allUsers = users.some(u => u.authorId === currentUser.authorId)
      ? users
      : [currentUser, ...users];

    res.json({ success: true, data: allUsers });
  } catch (error) {
    next(error);
  }
};
