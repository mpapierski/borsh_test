var borsh = require('borsh');
var fs = require('fs');

export abstract class Enum {
    enum: string;

    constructor(properties: any) {
        if (Object.keys(properties).length !== 1) {
            throw new Error('Enum can only take single value');
        }
        Object.keys(properties).map((key: string) => {
            (this as any)[key] = properties[key];
            this.enum = key;
        });
    }
  }

export abstract class Assignable {
    constructor(properties: any) {
        Object.keys(properties).map((key: any) => {
            (this as any)[key] = properties[key];
        });
    }
}

export class Account extends Assignable {
    account_hash: Uint8Array;
    named_keys: NamedKey[];
    associated_keys: AssociatedKey[];
    action_thresholds: ActionThresholds;
}

export class Key extends Enum {
    account: Uint8Array;
}

export class NamedKey extends Assignable {
    key: String;
    value: Key;
}

export class URef extends Assignable {
    address: Uint8Array;
    access_bits: number;
}

export class AssociatedKey extends Assignable {
    account_hash: Uint8Array;
    weight: number;
}

export class ActionThresholds extends Assignable {
    deployment: number;
    key_management: number;
}

export const SCHEMA = new Map<Function, any>([
    [Account, {kind: 'struct', fields: [
        ['account_hash', [32]],
        ['named_keys', [NamedKey]],
        ['main_purse', URef],
        ['associated_keys', [AssociatedKey]],
        ['action_thresholds', ActionThresholds],
    ]}],
    [Key, {kind: 'enum', field: 'enum', values: [
        ['account', [32]],
    ]}],
    [NamedKey, {kind: 'struct', fields: [
        ['key', 'string'],
        ['value', Key],
    ]}],
    [URef, {kind: 'struct', fields: [
        ['address', [32]],
        ['access_bits', 'u8'],
    ]}],
    [AssociatedKey, {kind: 'struct', fields: [
        ['account_hash', [32]],
        ['weight', 'u8'],
    ]}],
    [ActionThresholds, {kind: 'struct', fields: [
        ['deployment', 'u8'],
        ['key_management', 'u8'],
    ]}]
]);

console.log('hello')

var namedKeyAccountKey = new Uint8Array(32);
namedKeyAccountKey[0] = 1;
namedKeyAccountKey[1] = 2;
namedKeyAccountKey[2] = 3;

const keyHash = new Key({account: namedKeyAccountKey});

let accountHash = new Uint8Array(32);
accountHash[0]=255;

const mainPurse = new URef({address: new Uint8Array(32), access_bits: 0b111});
const value = new Account({
    account_hash: accountHash,
    named_keys: [
        new NamedKey({key: "hello", value: keyHash}),
    ],
    main_purse: mainPurse,
    associated_keys: [
        new AssociatedKey({
            account_hash: accountHash,
            weight: 1,
        }),
    ],
    action_thresholds:
        new ActionThresholds({
            deployment: 1,
            key_management: 1,
        })
});
const buffer = borsh.serialize(SCHEMA, value);
console.log('serialized', buffer.toString('hex'));

var decodeHexString = function (hexString) {
    var result = [];
    while (hexString.length >= 2) {
        result.push(parseInt(hexString.substring(0, 2), 16));
        hexString = hexString.substring(2, hexString.length);
    }
    return Buffer.from(result);
 }

const serializedAccount = decodeHexString("ff00000000000000000000000000000000000000000000000000000000000000010000000500000068656c6c6f00010203000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000701000000ff00000000000000000000000000000000000000000000000000000000000000010101");
const deserializedAccount = borsh.deserialize(SCHEMA, Account, serializedAccount);
console.log('deserialized', deserializedAccount);
