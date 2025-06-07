import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type AlertModalProps = {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  isSuccess: boolean;
};

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, onClose, isSuccess }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">
            {isSuccess ? 'Success' : 'Error'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
        <div className="mt-6 text-center">
          <Button onClick={onClose} variant="outline" className="text-sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
