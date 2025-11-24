import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { CloudUpload, AttachMoney } from '@mui/icons-material';
import { useCreatePurchaseRequest } from '@/hooks/useApi';
import { validateInput, sanitizeInput } from '@/utils/validation';

interface PurchaseRequestFormProps {
  onSuccess?: () => void;
}

const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    justification: '',
  });
  const [proformaFile, setProformaFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreatePurchaseRequest();

  const handleInputChange = (field: string, value: string) => {
    const sanitized = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitized }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, proforma: 'Only PDF, JPEG, and PNG files are allowed' }));
        return;
      }

      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, proforma: 'File size must be less than 5MB' }));
        return;
      }

      setProformaFile(file);
      setErrors(prev => ({ ...prev, proforma: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!validateInput(formData.title, 'required')) {
      newErrors.title = 'Title is required';
    }

    if (!validateInput(formData.description, 'required')) {
      newErrors.description = 'Description is required';
    }

    if (!validateInput(formData.amount, 'required')) {
      newErrors.amount = 'Amount is required';
    } else if (!validateInput(formData.amount, 'number')) {
      newErrors.amount = 'Amount must be a valid number';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!validateInput(formData.justification, 'required')) {
      newErrors.justification = 'Justification is required';
    }

    if (!proformaFile) {
      newErrors.proforma = 'Proforma document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('amount', formData.amount);
    submitData.append('justification', formData.justification);
    
    if (proformaFile) {
      submitData.append('proforma', proformaFile);
    }

    try {
      await createMutation.mutateAsync(submitData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: '',
        justification: '',
      });
      setProformaFile(null);
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create purchase request:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Create Purchase Request
      </Typography>

      {createMutation.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {createMutation.error.message || 'Failed to create purchase request'}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney />
                  </InputAdornment>
                ),
              }}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Justification"
              multiline
              rows={3}
              value={formData.justification}
              onChange={(e) => handleInputChange('justification', e.target.value)}
              error={!!errors.justification}
              helperText={errors.justification}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Box>
              <input
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: 'none' }}
                id="proforma-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="proforma-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Upload Proforma Document
                </Button>
              </label>
              
              {proformaFile && (
                <Typography variant="body2" color="text.secondary">
                  Selected: {proformaFile.name}
                </Typography>
              )}
              
              {errors.proforma && (
                <Typography variant="body2" color="error">
                  {errors.proforma}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={createMutation.isPending}
              startIcon={createMutation.isPending ? <CircularProgress size={20} /> : null}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Purchase Request'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default PurchaseRequestForm;