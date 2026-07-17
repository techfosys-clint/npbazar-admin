import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export const toastSuccess = (title: string) => Toast.fire({ icon: 'success', title });
export const toastError = (title: string) => Toast.fire({ icon: 'error', title });

/** SweetAlert confirm dialog for destructive actions. Resolves true if confirmed. */
export const confirmDialog = async (
  title: string,
  text = 'This action cannot be undone.',
  confirmButtonText = 'Yes, delete it!'
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#18181b',
    confirmButtonText,
  });
  return result.isConfirmed;
};
