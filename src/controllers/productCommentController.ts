import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types/auth';

export const getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const { page = 1, limit = 50 } = (req as any).parsedQuery || {};

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const [comments, total] = await Promise.all([
      prisma.productComment.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.productComment.count({ where: { productId } }),
    ]);

    res.json({
      success: true,
      data: comments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const { content } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    const comment = await prisma.productComment.create({
      data: {
        productId,
        content,
        authorId: req.user.id,
        authorUsername: req.user.username,
        authorName: req.user.fullName || req.user.username,
      },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const commentId = req.params.commentId as string;
    const { content } = req.body;

    const existing = await prisma.productComment.findFirst({
      where: { id: commentId, productId },
    });

    if (!existing) {
      throw new AppError('Commentaire non trouvé', 404);
    }

    if (existing.authorId !== req.user.id) {
      throw new AppError('Vous ne pouvez modifier que vos propres commentaires', 403);
    }

    const updated = await prisma.productComment.update({
      where: { id: commentId },
      data: { content },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const commentId = req.params.commentId as string;

    const existing = await prisma.productComment.findFirst({
      where: { id: commentId, productId },
    });

    if (!existing) {
      throw new AppError('Commentaire non trouvé', 404);
    }

    const isAdmin = req.user.roles?.includes('admin');
    if (existing.authorId !== req.user.id && !isAdmin) {
      throw new AppError('Vous ne pouvez supprimer que vos propres commentaires', 403);
    }

    await prisma.productComment.delete({ where: { id: commentId } });

    res.json({ success: true, message: 'Commentaire supprimé' });
  } catch (error) {
    next(error);
  }
};
