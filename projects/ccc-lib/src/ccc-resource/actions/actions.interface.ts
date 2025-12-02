import { RecordData, ResourceMeta } from '@cccteam/ccc-lib/src/types';

export type ActionButtonContext =
  | {
      actionType: 'create' | 'edit' | 'delete';
      meta: ResourceMeta;
      resourceData: RecordData;
      shouldRender: (data: RecordData) => boolean;
    }
  | {
      actionType: 'rpc';
      // meta: RpcMethod; // Currently unused, but likely where ABAC permissions should live once implemented
      resourceData: RecordData;
      shouldRender: (data: RecordData) => boolean;
    };
