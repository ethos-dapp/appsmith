import { isEqual } from "lodash";
import { WorkerErrorTypes } from "@appsmith/workers/common/types";
import { JSLibraries, resetJSLibraries } from "workers/common/JSLibrary";
import {
  LintWorkerRequest,
  LintTreeResponse,
  LINT_WORKER_ACTIONS,
  LintTreeRequest,
} from "./types";
import { getlintErrorsFromTree } from "./utils";
import { TMessage, MessageType, sendMessage } from "utils/MessageUtil";

function messageEventListener(fn: typeof eventRequestHandler) {
  return (event: MessageEvent<TMessage<LintWorkerRequest>>) => {
    const { messageType } = event.data;
    if (messageType !== MessageType.REQUEST) return;
    const { body, messageId } = event.data;
    const { data, method } = body;
    if (!method) return;

    const startTime = performance.now();
    const responseData = fn({ method, requestData: data });
    const endTime = performance.now();
    if (!responseData) return;

    try {
      sendMessage.call(self, {
        messageId,
        messageType: MessageType.RESPONSE,
        body: {
          data: responseData,
          timeTaken: (endTime - startTime).toFixed(2),
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      sendMessage.call(self, {
        messageId,
        messageType: MessageType.RESPONSE,
        body: {
          data: {
            errors: [
              {
                type: WorkerErrorTypes.CLONE_ERROR,
                message: (e as Error)?.message,
              },
            ],
          },
          timeTaken: (endTime - startTime).toFixed(2),
        },
      });
    }
  };
}

function eventRequestHandler({
  method,
  requestData,
}: {
  method: LINT_WORKER_ACTIONS;
  requestData: any;
}): LintTreeResponse | unknown {
  switch (method) {
    case LINT_WORKER_ACTIONS.LINT_TREE: {
      const lintTreeResponse: LintTreeResponse = { errors: {} };
      try {
        const { pathsToLint, unevalTree } = requestData as LintTreeRequest;
        const lintErrors = getlintErrorsFromTree(pathsToLint, unevalTree);
        lintTreeResponse.errors = lintErrors;
      } catch (e) {}
      return lintTreeResponse;
    }
    case LINT_WORKER_ACTIONS.UPDATE_LINT_GLOBALS: {
      const { add, libs } = requestData;
      if (add) {
        JSLibraries.push(...libs);
      } else if (add === false) {
        for (const lib of libs) {
          const idx = JSLibraries.findIndex((l) =>
            isEqual(l.accessor.sort(), lib.accessor.sort()),
          );
          if (idx === -1) return;
          JSLibraries.splice(idx, 1);
        }
      } else {
        resetJSLibraries();
        JSLibraries.push(...libs);
      }
      return true;
    }
    default: {
      // eslint-disable-next-line no-console
      console.error("Action not registered on lintWorker ", method);
    }
  }
}

self.onmessage = messageEventListener(eventRequestHandler);
