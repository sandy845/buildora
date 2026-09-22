export type AuthFormValues = {
  name?: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  otp?: string;
};

function textValue(values: Record<string, unknown>, field: string) {
  return typeof values[field] === "string" ? values[field] as string : "";
}

export function validateRegister(values: Record<string, unknown>) {
  const errors: Partial<Record<string, string>> = {};
  const name = textValue(values, "name");
  const email = textValue(values, "email");
  const phone = textValue(values, "phone");
  const password = textValue(values, "password");
  const confirmPassword = textValue(values, "confirmPassword");

  if (!name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email.";
  }

  if (!phone.trim()) {
    errors.phone = "Please enter your phone number.";
  }

  if (!password) {
    errors.password = "Please enter a password.";
  } else if (password.length < 8 || password.length > 256) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function validateLogin(values: Record<string, unknown>) {
  const errors: Partial<Record<string, string>> = {};
  const email = textValue(values, "email");
  const password = textValue(values, "password");

  if (!email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email.";
  }

  if (!password) {
    errors.password = "Please enter your password.";
  }

  return errors;
}

export function validateReset(values: Record<string, unknown>) {
  const errors: Partial<Record<string, string>> = {};
  const email = textValue(values, "email");

  if (!email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email.";
  }

  return errors;
}

export function validateVerify(values: Record<string, unknown>) {
  const errors: Partial<Record<string, string>> = {};
  const otp = textValue(values, "otp");

  if (!otp.trim()) {
    errors.otp = "Please enter the verification code.";
  }

  return errors;
}
