import Contact from "../models/Contact.js";

export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    const c = await Contact.create({ name, email, phone, message });
    // optionally send email to admin
    res.status(201).json(c);
  } catch(err){ next(err); }
};

export const listContacts = async (req, res, next) => {
  try {
    const items = await Contact.find().sort("-createdAt");
    res.json(items);
  } catch(err){ next(err); }
};
