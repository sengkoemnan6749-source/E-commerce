import QRCode from 'qrcode';
import * as adminVaultService from '../services/adminVaultService.js';

export async function getVaultStatus(req, res, next) {
  try {
    const data = await adminVaultService.getVaultStatus(req);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function beginVaultSetup(req, res, next) {
  try {
    const data = await adminVaultService.beginVaultSetup(req, QRCode);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function confirmVaultSetup(req, res, next) {
  try {
    const data = await adminVaultService.confirmVaultSetup(req, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function unlockVault(req, res, next) {
  try {
    const data = await adminVaultService.unlockVault(req, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function lockVault(req, res, next) {
  try {
    const data = await adminVaultService.lockVault(req);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

