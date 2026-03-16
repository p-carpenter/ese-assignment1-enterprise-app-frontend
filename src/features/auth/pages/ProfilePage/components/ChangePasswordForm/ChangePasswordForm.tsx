import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button, AlertMessage } from "@/shared/components";
import { changePassword } from "@/features/auth/api";
import { changePasswordSchema, type ChangePasswordValues } from "./schema.ts";
import styles from "./ChangePasswordForm.module.css";
import { ApiError } from "@/shared/api/errors";

interface ChangePasswordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChangePasswordForm = ({
  onSuccess,
  onCancel,
}: ChangePasswordFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const {
    mutate: submitPasswordChange,
    isPending,
    error: saveError,
  } = useMutation({
    mutationFn: (data: ChangePasswordValues) =>
      changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmNewPassword,
      ),
    onSuccess,
  });

  const onSubmit = (data: ChangePasswordValues) => {
    submitPasswordChange(data);
  };

  const saveErrorMessage =
    saveError instanceof ApiError
      ? saveError.getReadableMessage()
      : saveError?.message || "An unexpected error occurred.";

  return (
    <form
      className={styles.changePasswordForm}
      onSubmit={handleSubmit(onSubmit)}
    >
      {saveError && <AlertMessage variant="error" message={saveErrorMessage} />}

      <div className={styles.inputGroup}>
        <input
          type="password"
          placeholder="Current Password"
          {...register("currentPassword")}
          className={styles.passwordInput}
        />
        {errors.currentPassword && (
          <span className={styles.errorText} role="alert">
            {errors.currentPassword.message}
          </span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          type="password"
          placeholder="New Password"
          {...register("newPassword")}
          className={styles.passwordInput}
        />
        {errors.newPassword && (
          <span className={styles.errorText} role="alert">
            {errors.newPassword.message}
          </span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          type="password"
          placeholder="Confirm New Password"
          {...register("confirmNewPassword")}
          className={styles.passwordInput}
        />
        {errors.confirmNewPassword && (
          <span className={styles.errorText} role="alert">
            {errors.confirmNewPassword.message}
          </span>
        )}
      </div>

      <div className={styles.passwordActions}>
        <Button
          type="submit"
          variant="outlined"
          size="small"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Change Password"}
        </Button>
        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
