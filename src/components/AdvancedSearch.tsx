'use client';

import { useState, FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@design-system/components';
import styles from './AdvancedSearch.module.css';

interface AdvancedSearchProps {
  onSearch: (filters: {
    search?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
  onClear: () => void;
}

export default function AdvancedSearch({ onSearch, onClear }: AdvancedSearchProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // No input validation (intentional vulnerability)
    // No sanitization of search input (XSS vulnerability)
    const filters: {
      search?: string;
      status?: string;
      minPrice?: number;
      maxPrice?: number;
    } = {};
    
    if (search.trim()) {
      filters.search = search.trim();
    }
    if (status) {
      filters.status = status;
    }
    if (minPrice) {
      filters.minPrice = parseFloat(minPrice);
    }
    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice);
    }
    
    onSearch(filters);
  };

  const handleClear = () => {
    setSearch('');
    setStatus('');
    setMinPrice('');
    setMaxPrice('');
    onClear();
  };

  return (
    <Card variant="outlined" padding="md" className={styles.container}>
      <CardHeader>
        <CardTitle>Advanced Search</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <Input
              id="search"
              label="Search"
              type="text"
              placeholder="Search by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
            
            <div className={styles.field}>
              <label htmlFor="status" className={styles.label}>Status:</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.select}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <Input
              id="minPrice"
              label="Min Price"
              type="number"
              placeholder="0.00"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              step="0.01"
              min="0"
              fullWidth
            />
            
            <Input
              id="maxPrice"
              label="Max Price"
              type="number"
              placeholder="10000.00"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              step="0.01"
              min="0"
              fullWidth
            />
          </div>

          <div className={styles.actions}>
            <Button type="submit" variant="primary">
              Search
            </Button>
            <Button type="button" variant="secondary" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
