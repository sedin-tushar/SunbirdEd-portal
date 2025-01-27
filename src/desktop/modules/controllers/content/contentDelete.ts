import * as _ from "lodash";
import { containerAPI, ISystemQueueInstance, SystemQueueReq } from "@project-sunbird/OpenRAP/api";
import * as path from "path";
import TreeModel from "tree-model";
import { Inject } from "typescript-ioc";
import DatabaseSDK from "../../sdk/database";
import Response from "../../utils/response";
import { ContentDeleteHelper } from "./contentDeleteHelper";
import { IContentDelete } from "./IContent";
import { StandardLogger } from '@project-sunbird/OpenRAP/services/standardLogger';
const xss = require('xss');
export default class ContentDelete {
    @Inject
    private databaseSdk: DatabaseSDK;
    private systemQueue: ISystemQueueInstance;
    @Inject private standardLog: StandardLogger;
    constructor(manifest) {
        this.databaseSdk.initialize(manifest.id);
        this.systemQueue = containerAPI.getSystemQueueInstance(manifest.id);
        this.systemQueue.register(ContentDeleteHelper.taskType, ContentDeleteHelper);
        this.standardLog = containerAPI.getStandardLoggerInstance();
    }

    public async delete(req, res) {
        const reqId = req.headers["X-msgid"];
        const contentIDS: string[] = _.get(req.body, "request.contents");
        if (!contentIDS) {
            this.standardLog.error({id: 'CONTENT_DELETE_ID_NOT_FOUND', message: `${reqId}: Error: content Ids not found`, error: `content Id not found`});
            return res.status(400).send(Response.error(`api.content.delete`, 400, "MISSING_CONTENTS"));
        }
        try {
            const failed: object[] = [];
            const dbFilter = {
                    selector: {
                            _id: {
                                $in: contentIDS,
                            },
                    },
                };
            let contentsToDelete = await this.databaseSdk.find("content", dbFilter).catch((error) => {
                    this.standardLog.error({id: 'CONTENT_DELETE_DB_SEARCH_FAILED', message: `Received Error while finding contents (isAvailable : false)`, error });
                });
            contentsToDelete = await this.getContentsToDelete(contentsToDelete.docs);
            let deleted = await this.databaseSdk.bulk("content", contentsToDelete).catch((err) => {
                this.standardLog.error({id: 'CONTENT_DELETE_DB_BULK_UPDATE_FAILED', message: `Received Error while deleting contents in a bulk`, error: err });
                failed.push(err.message || err.errMessage);
            });
            let deletedContentMeta = {};
            deleted =  _.map(deleted, (content) => content.id);
            _.forEach(contentsToDelete, (content) => {
                deletedContentMeta[content.identifier] = new Date().getTime();
                if(content.mimeType === 'application/vnd.sunbird.questionset') {
                    _.forEach(content.children, (child) => {
                        if(child.mimeType === 'application/vnd.sunbird.questionset' && !_.includes(deleted, child.identifier)) {
                            deleted = [...deleted, child.identifier]
                        }
                    })
                }
            })
            const contentPaths: string[] = _.map(deleted, (id) => {
                if (id) {
                    return path.join("content", id);
                }
            });
            if (contentPaths) {
                await this.add(contentPaths, contentsToDelete[0]["name"]);
            }
            res.send(xss(JSON.stringify(Response.success("api.content.delete", {deleted, failed, deletedContentMeta}, req))));
            } catch (err) {
                this.standardLog.error({ id: 'CONTENT_DELETE_FAILED', message: 'Received Error while Deleting content', error: err });
                res.status(500);
                res.send(Response.error(`api.content.delete`, 500, err.errMessage || err.message, err.code));
            }
    }

    public async add(contentDeletePaths: string[], name): Promise<string[]> {
        const insertData: SystemQueueReq = {
            type: ContentDeleteHelper.taskType,
            name,
            metaData: {
              filePaths: contentDeletePaths,
            },
        };
        const ids = await this.systemQueue.add(insertData);
        return ids;
    }

    public async getContentsToDelete(contentsToDelete: IContentDelete[]): Promise <IContentDelete[]> {
        const deleteContents: IContentDelete[] = [];
        for (const content of contentsToDelete) {
            content.desktopAppMetadata.isAvailable = false;
            deleteContents.push(content);
            if (content.mimeType === "application/vnd.ekstep.content-collection" || content.mimeType === "application/vnd.sunbird.questionset") {
                const children: object[] = await this.getResources(content);
                for (const child of children["docs"]) {
                    child.desktopAppMetadata.isAvailable = false;
                    deleteContents.push(child);
                }
            }
        }
        return deleteContents;
    }

    public async getResources(content: {}): Promise<object[]> {
        const resourceIds: string[] = [];
        const model = new TreeModel();
        let treeModel;
        treeModel = model.parse(content);
        treeModel.walk((node: { model: { mimeType: string; identifier: string; }; }) => {
            if (node.model.mimeType !== "application/vnd.ekstep.content-collection") {
                resourceIds.push(node.model.identifier);
            }
        });
        const dbFilter = {
            selector: {
                $and: [
                    {
                        _id: {
                            $in: resourceIds,
                        },
                    },
                    {
                        mimeType: {
                            $nin: ["application/vnd.ekstep.content-collection"],
                        },
                    },
                    {
                        visibility: {
                            $eq: "Parent",
                        },
                    },
                ],
            },
        };
        this.standardLog.info({ id: 'CONTENT_DELETE_FIND_CHILDREN', message: `finding all child contents of a collection` });
        return this.databaseSdk.find("content", dbFilter);
    }
}
