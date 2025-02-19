import { GooglePaLMEmbeddings, GooglePaLMEmbeddingsParams } from '@langchain/community/embeddings/googlepalm'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class GooglePaLMEmbedding_Embeddings implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Google PaLM Embeddings'
        this.name = 'googlePaLMEmbeddings'
        this.version = 1.0
        this.type = 'GooglePaLMEmbeddings'
        this.icon = 'GooglePaLM.svg'
        this.category = 'Embeddings'
        this.description = 'API Google MakerSuite PaLM para gerar embeddings para um determinado texto'
        this.baseClasses = [this.type, ...getBaseClasses(GooglePaLMEmbeddings)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleMakerSuite']
        }
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [
                    {
                        label: 'models/embedding-gecko-001',
                        name: 'models/embedding-gecko-001'
                    }
                ],
                default: 'models/embedding-gecko-001',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const modelName = nodeData.inputs?.modelName as string

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const googleMakerSuiteKey = getCredentialParam('googleMakerSuiteKey', credentialData, nodeData)

        const obj: Partial<GooglePaLMEmbeddingsParams> = {
            modelName: modelName,
            apiKey: googleMakerSuiteKey
        }

        const model = new GooglePaLMEmbeddings(obj)
        return model
    }
}

module.exports = { nodeClass: GooglePaLMEmbedding_Embeddings }
