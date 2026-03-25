import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// ===========================================
// French Phone Number Validator
// ===========================================

@ValidatorConstraint({ async: false })
export class IsFrenchPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string): boolean {
    if (!phone) return false;
    // French phone number: +33 followed by 9 digits or 0 followed by 9 digits
    const frenchPhoneRegex = /^(\+33|0033|0)[1-9](\d{2}){4}$/;
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    return frenchPhoneRegex.test(cleanPhone);
  }

  defaultMessage(): string {
    return 'Le numéro de téléphone doit être un numéro français valide';
  }
}

export function IsFrenchPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFrenchPhoneConstraint,
    });
  };
}

// ===========================================
// SIRET Validator (French business ID)
// ===========================================

@ValidatorConstraint({ async: false })
export class IsSiretConstraint implements ValidatorConstraintInterface {
  validate(siret: string): boolean {
    if (!siret || siret.length !== 14) return false;
    if (!/^\d{14}$/.test(siret)) return false;

    // Luhn algorithm for SIRET
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let digit = parseInt(siret[i]!, 10);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  }

  defaultMessage(): string {
    return 'Le numéro SIRET doit être valide (14 chiffres)';
  }
}

export function IsSiret(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSiretConstraint,
    });
  };
}

// ===========================================
// Strong Password Validator
// ===========================================

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (!password || password.length < 8) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  defaultMessage(): string {
    return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// ===========================================
// French Postal Code Validator
// ===========================================

@ValidatorConstraint({ async: false })
export class IsFrenchPostalCodeConstraint implements ValidatorConstraintInterface {
  validate(postalCode: string): boolean {
    if (!postalCode) return false;
    // French postal codes: 5 digits, first 2 are department (01-95, 971-976 for DOM-TOM)
    const postalCodeRegex = /^(0[1-9]|[1-8]\d|9[0-5]|97[1-6])\d{3}$/;
    return postalCodeRegex.test(postalCode);
  }

  defaultMessage(): string {
    return 'Le code postal doit être un code postal français valide';
  }
}

export function IsFrenchPostalCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFrenchPostalCodeConstraint,
    });
  };
}

// ===========================================
// Match Field Validator (for password confirmation)
// ===========================================

export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${propertyName} doit correspondre à ${relatedPropertyName}`;
        },
      },
    });
  };
}

// ===========================================
// Future Date Validator
// ===========================================

@ValidatorConstraint({ async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date): boolean {
    if (!date) return false;
    return new Date(date) > new Date();
  }

  defaultMessage(): string {
    return 'La date doit être dans le futur';
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

// ===========================================
// No HTML/Script Tags Validator (XSS prevention)
// ===========================================

@ValidatorConstraint({ async: false })
export class NoHtmlTagsConstraint implements ValidatorConstraintInterface {
  validate(text: string): boolean {
    if (!text) return true;
    const htmlTagRegex = /<[^>]*>/g;
    return !htmlTagRegex.test(text);
  }

  defaultMessage(): string {
    return 'Le texte ne doit pas contenir de balises HTML';
  }
}

export function NoHtmlTags(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoHtmlTagsConstraint,
    });
  };
}

// ===========================================
// Latitude Validator
// ===========================================

@ValidatorConstraint({ async: false })
export class IsLatitudeConstraint implements ValidatorConstraintInterface {
  validate(latitude: number): boolean {
    if (latitude === undefined || latitude === null) return false;
    return latitude >= -90 && latitude <= 90;
  }

  defaultMessage(): string {
    return 'La latitude doit être comprise entre -90 et 90';
  }
}

export function IsLatitude(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLatitudeConstraint,
    });
  };
}

// ===========================================
// Longitude Validator
// ===========================================

@ValidatorConstraint({ async: false })
export class IsLongitudeConstraint implements ValidatorConstraintInterface {
  validate(longitude: number): boolean {
    if (longitude === undefined || longitude === null) return false;
    return longitude >= -180 && longitude <= 180;
  }

  defaultMessage(): string {
    return 'La longitude doit être comprise entre -180 et 180';
  }
}

export function IsLongitude(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLongitudeConstraint,
    });
  };
}
