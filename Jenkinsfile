pipeline {
    agent any

    environment {
    NODE_ENV = 'production'
    AWS_REGION = 'ap-south-1' // Mumbai region
}

       
    tools {
        nodejs 'NodeJS-18' // Must match configured NodeJS in Jenkins global tools
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running tests...'
                sh 'npm test -- --watchAll=false' // Remove || true to fail on test errors
            }
        }

        stage('Build') {
            steps {
                echo 'Building application...'
                sh 'npm run build'
            }
        }

        stage('Archive Build') {
            steps {
                echo 'Archiving build...'
                archiveArtifacts artifacts: 'build/', fingerprint: true
            }
        }

        stage('Terraform Init') {
            steps {
                dir('terraform') {
                    echo 'Initializing Terraform...'
                    sh 'terraform init'
                }
            }
        }

        stage('Terraform Plan') {
            steps {
                dir('terraform') {
                    echo 'Planning Terraform deployment...'
                    sh 'terraform plan'
                }
            }
        }

        stage('Terraform Apply') {
            steps {
                dir('terraform') {
                    echo 'Applying Terraform deployment...'
                    sh 'terraform apply -auto-approve'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo '✅ Build, test, and deploy successful!'
        }
        failure {
            echo '❌ Build, test, or deploy failed!'
        }
    }
}
