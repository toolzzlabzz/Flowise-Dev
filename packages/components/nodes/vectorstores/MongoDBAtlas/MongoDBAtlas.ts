import { flatten } from 'lodash'
import { MongoClient } from 'mongodb'
import { MongoDBAtlasVectorSearch } from '@langchain/community/vectorstores/mongodb_atlas'
import { Embeddings } from '@langchain/core/embeddings'
import { Document } from '@langchain/core/documents'
import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { addMMRInputParams, resolveVectorStoreOrRetriever } from '../VectorStoreUtils'

class MongoDBAtlas_VectorStores implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    badge: string
    baseClasses: string[]
    inputs: INodeParams[]
    credential: INodeParams
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'MongoDB Atlas'
        this.name = 'mongoDBAtlas'
        this.version = 1.0
        this.description = `Atualizar ou inserir dados incorporados e realizar uma pesquisa de similaridade durante uma consulta usando o MongoDB Atlas, um banco de dados MongoDB na nuvem gerenciado`
        this.type = 'MongoDB Atlas'
        this.icon = 'mongodb.svg'
        this.category = 'Vector Stores'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.badge = 'NEW'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mongoDBUrlApi']
        }
        this.inputs = [
            {
                label: 'Document',
                name: 'document',
                type: 'Document',
                list: true,
                optional: true
            },
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
            {
                label: 'Database',
                name: 'databaseName',
                placeholder: '<DB_NAME>',
                type: 'string'
            },
            {
                label: 'Collection Name',
                name: 'collectionName',
                placeholder: '<COLLECTION_NAME>',
                type: 'string'
            },
            {
                label: 'Index Name',
                name: 'indexName',
                placeholder: '<VECTOR_INDEX_NAME>',
                type: 'string'
            },
            {
                label: 'Content Field',
                name: 'textKey',
                description: 'Name of the field (column) that contains the actual content',
                type: 'string',
                default: 'text',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Embedded Field',
                name: 'embeddingKey',
                description: 'Name of the field (column) that contains the Embedding',
                type: 'string',
                default: 'embedding',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ]
        addMMRInputParams(this.inputs)
        this.outputs = [
            {
                label: 'MongoDB Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'MongoDB Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...getBaseClasses(MongoDBAtlasVectorSearch)]
            }
        ]
    }

    //@ts-ignore
    vectorStoreMethods = {
        async upsert(nodeData: INodeData, options: ICommonObject): Promise<void> {
            const credentialData = await getCredentialData(nodeData.credential ?? '', options)
            const databaseName = nodeData.inputs?.databaseName as string
            const collectionName = nodeData.inputs?.collectionName as string
            const indexName = nodeData.inputs?.indexName as string
            let textKey = nodeData.inputs?.textKey as string
            let embeddingKey = nodeData.inputs?.embeddingKey as string
            const embeddings = nodeData.inputs?.embeddings as Embeddings

            let mongoDBConnectUrl = getCredentialParam('mongoDBConnectUrl', credentialData, nodeData)

            const docs = nodeData.inputs?.document as Document[]

            const flattenDocs = docs && docs.length ? flatten(docs) : []
            const finalDocs = []
            for (let i = 0; i < flattenDocs.length; i += 1) {
                if (flattenDocs[i] && flattenDocs[i].pageContent) {
                    const document = new Document(flattenDocs[i])
                    finalDocs.push(document)
                }
            }

            const mongoClient = new MongoClient(mongoDBConnectUrl)
            const collection = mongoClient.db(databaseName).collection(collectionName)

            if (!textKey || textKey === '') textKey = 'text'
            if (!embeddingKey || embeddingKey === '') embeddingKey = 'embedding'

            const mongoDBAtlasVectorSearch = new MongoDBAtlasVectorSearch(embeddings, {
                collection,
                indexName,
                textKey,
                embeddingKey
            })

            try {
                await mongoDBAtlasVectorSearch.addDocuments(finalDocs)
            } catch (e) {
                throw new Error(e)
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const databaseName = nodeData.inputs?.databaseName as string
        const collectionName = nodeData.inputs?.collectionName as string
        const indexName = nodeData.inputs?.indexName as string
        let textKey = nodeData.inputs?.textKey as string
        let embeddingKey = nodeData.inputs?.embeddingKey as string
        const embeddings = nodeData.inputs?.embeddings as Embeddings

        let mongoDBConnectUrl = getCredentialParam('mongoDBConnectUrl', credentialData, nodeData)

        const mongoClient = new MongoClient(mongoDBConnectUrl)
        const collection = mongoClient.db(databaseName).collection(collectionName)

        if (!textKey || textKey === '') textKey = 'text'
        if (!embeddingKey || embeddingKey === '') embeddingKey = 'embedding'

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection,
            indexName,
            textKey,
            embeddingKey
        })

        return resolveVectorStoreOrRetriever(nodeData, vectorStore)
    }
}

module.exports = { nodeClass: MongoDBAtlas_VectorStores }
