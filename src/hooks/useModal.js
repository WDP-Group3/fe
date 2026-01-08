import { useState } from 'react';

/**
 * Custom hook for managing modal state
 * @returns {object} { isOpen, open, close, toggle }
 */
const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, open, close, toggle };
};

export default useModal;

