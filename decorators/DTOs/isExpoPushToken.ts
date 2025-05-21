import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import Expo from 'expo-server-sdk';

@ValidatorConstraint({ async: false })
export class isExpoPushTokenConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return Expo.isExpoPushToken(value);
  }

  defaultMessage() {
    return 'Not vaild token';
  }
}

export function isExpoPushToken(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: isExpoPushTokenConstraint,
    });
  };
}
