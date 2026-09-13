'use client';
import { useEffect, useCallback } from 'react';

/**
 * Hook para manejar la tecla Escape en modales y diálogos
 * @param {Function} onClose - Función a ejecutar cuando se presiona Escape
 * @param {boolean} enabled - Si el hook está habilitado (default: true)
 * @param {Object} options - Opciones adicionales
 * @param {string} options.modalId - ID del modal para buscar en el DOM
 * @param {boolean} options.stopPropagation - Si debe detener la propagación del evento
 */
export function useEscapeKey(onClose, enabled = true, options = {}) {
  const { modalId, stopPropagation = false } = options;

  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled) return;

      // Verificar si Escape fue presionado
      if (e.key === 'Escape') {
        // Si hay un modal específico, verificar que el evento venga de ese modal
        if (modalId) {
          const modal = document.getElementById(modalId);
          if (modal && !modal.contains(e.target)) {
            return;
          }
        }

        // Detener la propagación si se requiere
        if (stopPropagation) {
          e.stopPropagation();
          e.preventDefault();
        }

        // Ejecutar la función de cierre
        onClose();
      }
    },
    [onClose, enabled, modalId, stopPropagation]
  );

  useEffect(() => {
    if (!enabled) return;

    // Agregar listener al document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Hook simplificado para cerrar modales con Escape
 * @param {Function} onClose - Función de cierre
 * @param {boolean} isOpen - Si el modal está abierto
 */
export function useModalEscape(onClose, isOpen) {
  useEscapeKey(onClose, isOpen, { stopPropagation: true });
}

/**
 * Hook para manejar clic fuera de un elemento
 * @param {Function} onClose - Función a ejecutar
 * @param {boolean} enabled - Si el hook está habilitado
 * @param {React.RefObject} ref - Ref del elemento a monitorear
 */
export function useClickOutside(onClose, enabled = true, ref) {
  useEffect(() => {
    if (!enabled || !ref?.current) return;

    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, enabled, ref]);
}

/**
 * Hook para combinar Escape y click outside para cerrar modales
 * @param {Function} onClose - Función de cierre
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {React.RefObject} ref - Ref del elemento modal
 */
export function useModalClose(onClose, isOpen, ref) {
  useModalEscape(onClose, isOpen);
  useClickOutside(onClose, isOpen, ref);
}
