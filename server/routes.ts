import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  // Customer routes
  app.get('/api/customers', async (req, res) => {
    try {
      const { search } = req.query;
      
      if (search && typeof search === 'string') {
        const customers = await storage.searchCustomers(search);
        res.json(customers);
      } else {
        const customers = await storage.getCustomers();
        res.json(customers);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });

  app.post('/api/customers', async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Validate that return date is after entry date
      if (new Date(customerData.returnDate) <= new Date(customerData.entryDate)) {
        return res.status(400).json({ message: 'Return date must be after entry date' });
      }
      
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid customer data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create customer' });
      }
    }
  });

  app.get('/api/customers/:id', async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customer' });
    }
  });

  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete customer' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
