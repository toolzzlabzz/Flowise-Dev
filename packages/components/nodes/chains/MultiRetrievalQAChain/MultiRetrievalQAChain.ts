import { BaseLanguageModel } from '@langchain/core/language_models/base'
import { MultiRetrievalQAChain } from 'langchain/chains'
import { ICommonObject, INode, INodeData, INodeParams, VectorStoreRetriever } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { ConsoleCallbackHandler, CustomChainHandler, additionalCallbacks } from '../../../src/handler'

class MultiRetrievalQAChain_Chains implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    baseClasses: string[]
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Multi Retrieval QA Chain'
        this.name = 'multiRetrievalQAChain'
        this.version = 1.0
        this.type = 'MultiRetrievalQAChain'
        this.icon = 'qa.svg'
        this.category = 'Chains'
        this.description =
            'Cadeia de controle de qualidade que escolhe automaticamente um armazenamento de vetores apropriado de vários recuperadores'
        this.baseClasses = [this.type, ...getBaseClasses(MultiRetrievalQAChain)]
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Vector Store Retriever',
                name: 'vectorStoreRetriever',
                type: 'VectorStoreRetriever',
                list: true
            },
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const model = nodeData.inputs?.model as BaseLanguageModel
        const vectorStoreRetriever = nodeData.inputs?.vectorStoreRetriever as VectorStoreRetriever[]
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments as boolean

        const retrieverNames = []
        const retrieverDescriptions = []
        const retrievers = []

        for (const vs of vectorStoreRetriever) {
            retrieverNames.push(vs.name)
            retrieverDescriptions.push(vs.description)
            retrievers.push(vs.vectorStore.asRetriever((vs.vectorStore as any).k ?? 4))
        }

        const chain = MultiRetrievalQAChain.fromLLMAndRetrievers(model, {
            retrieverNames,
            retrieverDescriptions,
            retrievers,
            retrievalQAChainOpts: { verbose: process.env.DEBUG === 'true' ? true : false, returnSourceDocuments }
        })
        return chain
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<string | ICommonObject> {
        const chain = nodeData.instance as MultiRetrievalQAChain
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments as boolean

        const obj = { input }
        const loggerHandler = new ConsoleCallbackHandler(options.logger)
        const callbacks = await additionalCallbacks(nodeData, options)

        if (options.socketIO && options.socketIOClientId) {
            const handler = new CustomChainHandler(options.socketIO, options.socketIOClientId, 2, returnSourceDocuments)
            const res = await chain.call(obj, [loggerHandler, handler, ...callbacks])
            if (res.text && res.sourceDocuments) return res
            return res?.text
        } else {
            const res = await chain.call(obj, [loggerHandler, ...callbacks])
            if (res.text && res.sourceDocuments) return res
            return res?.text
        }
    }
}

module.exports = { nodeClass: MultiRetrievalQAChain_Chains }
