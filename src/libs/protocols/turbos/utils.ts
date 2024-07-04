import {
  ObjectOwner,
  OwnedObjectRef,
  SuiMoveObject,
  SuiObjectData,
  SuiObjectRef,
  SuiObjectResponse,
  SuiParsedData,
} from "@mysten/sui.js/client";

type SuiObjectResponseError = any;
type ObjectContentFields = any;
type ObjectType = any;

export function getObjectReference(
  resp: SuiObjectResponse | OwnedObjectRef,
): SuiObjectRef | undefined {
  if ("reference" in resp) {
    return resp.reference;
  }
  const exists = getSuiObjectData(resp);
  if (exists) {
    return {
      objectId: exists.objectId,
      version: exists.version,
      digest: exists.digest,
    };
  }
  return getObjectDeletedResponse(resp);
}

export function getObjectId(
  data: SuiObjectResponse | SuiObjectRef | OwnedObjectRef,
): string {
  if ("objectId" in data) {
    return data.objectId;
  }
  return (
    getObjectReference(data)?.objectId ??
    getObjectNotExistsResponse(data as SuiObjectResponse)!
  );
}

export function getObjectFields(
  resp: SuiObjectResponse | SuiMoveObject | SuiObjectData,
): ObjectContentFields | undefined {
  if ("fields" in resp) {
    return resp.fields;
  }
  return getMoveObject(resp)?.fields;
}

export function getMoveObject(
  data: SuiObjectResponse | SuiObjectData,
): SuiMoveObject | undefined {
  const suiObject =
    "data" in data ? getSuiObjectData(data) : (data as SuiObjectData);

  if (
    !suiObject ||
    !isSuiObjectDataWithContent(suiObject) ||
    suiObject.content.dataType !== "moveObject"
  ) {
    return undefined;
  }

  return suiObject.content as SuiMoveObject;
}

export interface SuiObjectDataWithContent extends SuiObjectData {
  content: SuiParsedData;
}

function isSuiObjectDataWithContent(
  data: SuiObjectData,
): data is SuiObjectDataWithContent {
  return data.content !== undefined;
}

export function getSuiObjectData(
  resp: SuiObjectResponse,
): SuiObjectData | null | undefined {
  return resp.data;
}

export function getObjectDeletedResponse(
  resp: SuiObjectResponse,
): SuiObjectRef | undefined {
  if (
    resp.error &&
    "object_id" in resp.error &&
    "version" in resp.error &&
    "digest" in resp.error
  ) {
    const error = resp.error as SuiObjectResponseError;
    return {
      objectId: error.object_id,
      version: error.version,
      digest: error.digest,
    } as SuiObjectRef;
  }

  return undefined;
}

export function getObjectNotExistsResponse(
  resp: SuiObjectResponse,
): string | undefined {
  if (
    resp.error &&
    "object_id" in resp.error &&
    !("version" in resp.error) &&
    !("digest" in resp.error)
  ) {
    return (resp.error as SuiObjectResponseError).object_id as string;
  }

  return undefined;
}

export function isSuiObjectResponse(
  resp: SuiObjectResponse | SuiObjectData,
): resp is SuiObjectResponse {
  return (resp as SuiObjectResponse).data !== undefined;
}

/**
 * Deriving the object type from the object response
 * @returns 'package' if the object is a package, move object type(e.g., 0x2::coin::Coin<0x2::sui::SUI>)
 * if the object is a move object
 */
export function getObjectType(
  resp: SuiObjectResponse | SuiObjectData,
): ObjectType | null | undefined {
  const data = isSuiObjectResponse(resp) ? resp.data : resp;

  if (!data?.type && "data" in resp) {
    if (data?.content?.dataType === "package") {
      return "package";
    }
    return getMoveObjectType(resp);
  }
  return data?.type;
}

export function getMoveObjectType(resp: SuiObjectResponse): string | undefined {
  return getMoveObject(resp)?.type;
}

export function getObjectOwner(
  resp: SuiObjectResponse /* | ObjectOwner*/,
): ObjectOwner | null | undefined {
  // if (is(resp, ObjectOwner)) {
  //   return resp;
  // }
  return getSuiObjectData(resp)?.owner;
}
