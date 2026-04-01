import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middlewares/auth';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplier: {
          select: { name: true, company_name: true }
        },
        inventory: true
      }
    });

    const productsWithStock = products.map(p => ({
      ...p,
      stock: p.inventory.reduce((acc, inv) => acc + inv.quantity, 0)
    }));

    res.status(200).json(productsWithStock);
  } catch (error) {
    console.error('getProducts Error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, sku, price, min_order_qty } = req.body;
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'Supplier') {
      res.status(403).json({ message: 'Only suppliers can create products' });
      return;
    }

    if (!name || !sku || !price) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const newProduct = await prisma.product.create({
      data: {
        supplier_id: userId,
        name,
        sku,
        price,
        min_order_qty: min_order_qty || 1,
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('createProduct Error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true, company_name: true } },
        inventory: { include: { warehouse: { select: { city: true, address: true } } } }
      }
    });
    if (!product) { res.status(404).json({ message: 'Product not found' }); return; }
    res.status(200).json(product);
  } catch (error) {
    console.error('getProductById Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, price, min_order_qty, status } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (price !== undefined) data.price = price;
    if (min_order_qty !== undefined) data.min_order_qty = min_order_qty;
    if (status) data.status = status;

    const product = await prisma.product.update({ where: { id }, data });
    res.status(200).json({ message: 'Product updated', product });
  } catch (error) {
    console.error('updateProduct Error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await prisma.product.delete({ where: { id } });
    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    console.error('deleteProduct Error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};
