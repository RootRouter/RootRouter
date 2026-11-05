import type { IrpModelList } from './types';

/**
 * RootRouter can score any candidate it is given, so it advertises IRP's
 * wildcard model. Buyers then send every allowed candidate under its seller's
 * service id.
 */
export const IRP_WILDCARD_MODEL = '*';

export function listIrpModels(): IrpModelList {
  return {
    object: 'list',
    data: [{ id: IRP_WILDCARD_MODEL, object: 'model' }],
  };
}
