import { VectaraStore, VectaraLibArgs, VectaraFilter, VectaraContextConfig } from '@langchain/community/vectorstores/vectara'
import { ICommonObject, INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class VectaraExisting_VectorStores implements INode {
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
        this.label = 'Vectara Load Existing Index'
        this.name = 'vectaraExistingIndex'
        this.version = 1.0
        this.type = 'Vectara'
        this.icon = 'vectara.png'
        this.category = 'Vector Stores'
        this.description = 'Carregar índice existente do Vectara'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.badge = 'DEPRECATING'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['vectaraApi']
        }
        this.inputs = [
            {
                label: 'Metadata Filter',
                name: 'filter',
                description: 'Filter to apply to Vectara metadata',
                type: 'string',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Sentences Before',
                name: 'sentencesBefore',
                description: 'Number of sentences to fetch before the matched sentence. Defaults to 2.',
                type: 'number',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Sentences After',
                name: 'sentencesAfter',
                description: 'Number of sentences to fetch after the matched sentence. Defaults to 2.',
                type: 'number',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Lambda',
                name: 'lambda',
                description:
                    'Improves retrieval accuracy by adjusting the balance (from 0 to 1) between neural search and keyword-based search factors.',
                type: 'number',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Defaults to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ]
        this.outputs = [
            {
                label: 'Vectara Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Vectara Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...getBaseClasses(VectaraStore)]
            }
        ]
    }
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const customerId = getCredentialParam('customerID', credentialData, nodeData)
        const corpusId = getCredentialParam('corpusID', credentialData, nodeData).split(',')

        const vectaraMetadataFilter = nodeData.inputs?.filter as string
        const sentencesBefore = nodeData.inputs?.sentencesBefore as number
        const sentencesAfter = nodeData.inputs?.sentencesAfter as number
        const lambda = nodeData.inputs?.lambda as number
        const output = nodeData.outputs?.output as string
        const topK = nodeData.inputs?.topK as string
        const k = topK ? parseInt(topK, 10) : 4

        const vectaraArgs: VectaraLibArgs = {
            apiKey: apiKey,
            customerId: customerId,
            corpusId: corpusId,
            source: 'flowise'
        }

        const vectaraFilter: VectaraFilter = {}
        if (vectaraMetadataFilter) vectaraFilter.filter = vectaraMetadataFilter
        if (lambda) vectaraFilter.lambda = lambda

        const vectaraContextConfig: VectaraContextConfig = {}
        if (sentencesBefore) vectaraContextConfig.sentencesBefore = sentencesBefore
        if (sentencesAfter) vectaraContextConfig.sentencesAfter = sentencesAfter
        vectaraFilter.contextConfig = vectaraContextConfig

        const vectorStore = new VectaraStore(vectaraArgs)

        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k, vectaraFilter)
            return retriever
        } else if (output === 'vectorStore') {
            ;(vectorStore as any).k = k
            return vectorStore
        }
        return vectorStore
    }
}

module.exports = { nodeClass: VectaraExisting_VectorStores }
