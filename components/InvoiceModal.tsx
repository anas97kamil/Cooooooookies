
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileSpreadsheet, Printer, Image as ImageIcon } from 'lucide-react';
import { SaleItem } from '../types';
import { utils, writeFile } from 'xlsx';
import * as htmlToImage from 'html-to-image';

interface InvoiceModalProps {
  items: SaleItem[];
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ items, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [confirmPrint, setConfirmPrint] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const timeStr = items[0]?.time || new Date().toLocaleTimeString('ar-SY');
  const dayDate = new Date().toLocaleDateString('ar-SY');
  const customerName = items[0]?.customerName || 'زبون عام';
  const orderId = items[0]?.orderId || '0000';

  const handleDownloadExcel = () => {
    const data = items.map(i => ({ 
      "المادة": i.name, 
      "الكمية": i.quantity, 
      "السعر": i.price, 
      "الإجمالي": i.price * i.quantity 
    }));
    data.push({ "المادة": "المجموع الكلي", "الكمية": 0, "السعر": 0, "الإجمالي": total });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Invoice");
    writeFile(wb, `فاتورة-${customerName}-${dayDate}.xlsx`);
  };

  const handle