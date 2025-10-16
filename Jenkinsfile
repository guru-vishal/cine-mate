pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        TF_HOME    = tool name: 'Terraform', type: 'terraform'
        PATH       = "${TF_HOME}:${env.PATH}"
    }

    stages {
        stage('Checkout') {
            steps {
                git(
                    url: 'https://github.com/guru-vishal/cine-mate.git',
                    credentialsId: 'github-creds',
                    branch: 'main'
                )
            }
        }

        stage('Setup Python Environment') {
            steps {
                sh '''
                  python3 -m venv venv
                  . venv/bin/activate
                  pip install -r requirements.txt
                '''
            }
        }

        stage('Run Unit Tests') {
            steps {
                sh '''
                  . venv/bin/activate
                  python3 -m pytest tests/unit/ -v
                '''
            }
        }

        stage('Terraform Init') {
            steps {
                dir('terraform') {
                    sh 'terraform init'
                }
            }
        }

        stage('Terraform Validate') {
            steps {
                dir('terraform') {
                    sh 'terraform validate'
                }
            }
        }

        stage('Terraform Plan') {
            steps {
                dir('terraform') {
                    sh 'terraform plan -out=tfplan'
                }
            }
        }

        stage('Approval') {
            steps {
                input message: 'Proceed to production deployment?', ok: 'Yes, Deploy'
            }
        }

        stage('Terraform Apply') {
            steps {
                dir('terraform') {
                    sh 'terraform apply -auto-approve tfplan'
                }
            }
        }

        stage('Deploy Recommendation Model') {
            steps {
                sh '''
                  . venv/bin/activate
                  python3 scripts/deploy_model.py
                '''
            }
        }

        stage('Integration Tests') {
            steps {
                sh '''
                  . venv/bin/activate
                  python3 -m pytest tests/integration/ -v
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            emailext(
                subject: "SUCCESS: ${env.JOB_NAME} Build #${env.BUILD_NUMBER}",
                body: "Deployment succeeded.\nBuild URL: ${env.BUILD_URL}",
                to: "hemavarnas25@gmail.com"
            )
        }
        failure {
            emailext(
                subject: "FAILURE: ${env.JOB_NAME} Build #${env.BUILD_NUMBER}",
                body: "Deployment failed. Check console output.\nBuild URL: ${env.BUILD_URL}",
                to: "hemavarnas25@gmail.com"
            )
        }
    }
}