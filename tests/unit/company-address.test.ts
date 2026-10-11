import assert from 'node:assert/strict';
import test from 'node:test';
import { addressError, addressValues, EMPTY_ADDRESS, postalInput } from '../../src/lib/company-address.ts';
import { lookupPostalCode } from '../../src/lib/postal-catalog.ts';
const complete = { ...EMPTY_ADDRESS, postalCode: '01000', state: 'Ciudad de México', municipality: 'Álvaro Obregón', colony: 'San Ángel', street: 'Revolución', exterior: '12', interior: '' };
test('postal codes preserve leading zeros and accept only five digits', () => {
 assert.equal(postalInput('01 000'), '01000');
 assert.equal(postalInput('01a0008'), '01000');
 assert.match(addressError({...complete, postalCode:'1000'})!, /5 cifras/);
 assert.match(addressError({...complete, postalCode:''})!, /código postal/);
});
test('address requires separate street, exterior number and zone, but interior is optional', () => {
 assert.equal(addressError(complete), null);
 for (const field of ['street','exterior','colony','municipality','state'] as const) assert.ok(addressError({...complete,[field]:' '}));
 assert.equal(addressError({...complete, exterior:'S/N'}), null);
});
test('public location contains only the zone; complete address is saved separately', () => {
 const result = addressValues({...complete, street:'  Revolución  ', interior:' 2B '});
 assert.equal(result.location,'Álvaro Obregón, Ciudad de México');
 assert.equal(result.address.street,'Revolución');
 assert.equal(result.address.interior,'2B');
 assert.equal(result.address.postalCode,'01000');
 assert.ok(!result.location.includes('Revolución'));
});
test('local catalog resolves a leading-zero code and all colonies of a shared code', async () => {
 assert.deepEqual(await lookupPostalCode('01000'), [{ state:'Ciudad de México', municipality:'Álvaro Obregón', colonies:['San Ángel'] }]);
 const shared = await lookupPostalCode('01030');
 assert.deepEqual(shared?.[0].colonies, ['Axotla','Florida']);
 assert.equal(await lookupPostalCode('00000'), null);
 assert.equal(await lookupPostalCode('../01000'), null);
});

test('structured address is enabled only when the owner response contains the migrated field', async () => {
 const { supportsCompanyAddress } = await import('../../src/lib/company-address.ts');
 assert.equal(supportsCompanyAddress({name:'Legacy company'}),false);
 assert.equal(supportsCompanyAddress(null),false);
 assert.equal(supportsCompanyAddress({address:null}),true);
 assert.equal(supportsCompanyAddress({address:complete}),true);
});

test('legacy schema save omits address entirely; migrated schema includes it', async () => {
 const { addressFieldsForSave } = await import('../../src/lib/company-address.ts');
 assert.deepEqual(addressFieldsForSave(false, complete, 'CDMX'), { location:'CDMX' });
 assert.deepEqual(addressFieldsForSave(true, complete, 'CDMX'), addressValues(complete));
});
