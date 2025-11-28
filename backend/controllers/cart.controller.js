import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const recalcCart = (cart) => {
  const subTotal = cart.items.reduce((s, it) => s + (it.price * it.qty), 0);
  cart.subTotal = subTotal;
  cart.total = subTotal + (cart.shipping || 0);
};

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if(!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    res.json(cart);
  } catch(err){ next(err); }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, qty = 1, attrs } = req.body;
    const product = await Product.findById(productId);
    if(!product) return res.status(404).json({ message: "Product không tồn tại" });
    let cart = await Cart.findOne({ user: userId });
    if(!cart) cart = await Cart.create({ user: userId, items: [] });

    // if item exists with same product + attrs, increase qty
    const existingIndex = cart.items.findIndex(it => it.product.equals(productId) && JSON.stringify(it.attrs||{}) === JSON.stringify(attrs||{}));
    if(existingIndex >= 0) {
      cart.items[existingIndex].qty += Number(qty);
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.currentPrice || product.price,
        qty: Number(qty),
        attrs: attrs || {},
        image: product.images?.[0]?.url || null
      });
    }
    recalcCart(cart);
    await cart.save();
    res.json(cart);
  } catch(err){ next(err); }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { itemIndex, qty } = req.body; // OR use productId+attrs
    const cart = await Cart.findOne({ user: userId });
    if(!cart) return res.status(404).json({ message: "Cart không tồn tại" });
    if(itemIndex < 0 || itemIndex >= cart.items.length) return res.status(400).json({ message: "Item không hợp lệ" });
    cart.items[itemIndex].qty = Number(qty);
    recalcCart(cart);
    await cart.save();
    res.json(cart);
  } catch(err){ next(err); }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: userId });
    if(!cart) return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
    cart.items = cart.items.filter(it => !it.product.equals(productId));
    recalcCart(cart);
    await cart.save();
    res.json(cart);
  } catch(err){ next(err); }
};
