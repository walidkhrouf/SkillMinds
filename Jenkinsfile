pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }

    environment {
        NEXUS_URL = 'http://192.168.33.10:8081'
        NEXUS_REPO = 'maven-releases'
        BUILD_VERSION = "${env.BUILD_ID}-${new Date().format('yyyyMMddHHmm')}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    credentialsId: 'github-token', 
                    url: 'https://github.com/Saif-Hlaimi/DevMinds_4TWIN5_pidev.git'
            }
        }

        stage('Verify Environment') {
            steps {
                script {
                    // Verify required commands
                    def commands = ['tar', 'curl', 'npm', 'node']
                    commands.each { cmd ->
                        def available = sh(script: "command -v ${cmd} || true", returnStatus: true) == 0
                        if (!available) {
                            error "ERROR: ${cmd} command not found. This is required for the pipeline."
                        }
                        echo "${cmd} command is available"
                    }

                    // Verify Nexus connectivity
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-credentials',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        def nexusStatus = sh(
                            script: "curl -s -o /dev/null -w '%{http_code}' -u ${env.NEXUS_USER}:${env.NEXUS_PASS} ${env.NEXUS_URL}/service/rest/v1/status",
                            returnStdout: true
                        ).trim()
                        
                        if (nexusStatus != "200") {
                            error "ERROR: Cannot connect to Nexus (HTTP ${nexusStatus}). Check URL and credentials."
                        }
                        echo "Nexus connection successful"
                    }
                }
            }
        }

        stage('Check GitHub Actions') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        def response = sh(script: """
                            curl -s -H "Authorization: token ${env.GITHUB_TOKEN}" \\
                                -H "Accept: application/vnd.github.v3+json" \\
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/workflows/ci.yml/runs?per_page=1
                        """, returnStdout: true).trim()

                        def json = readJSON text: response
                        def run = json.workflow_runs[0] ?: error('No GitHub Actions runs found')

                        echo """
                        GitHub Actions Run:
                        - ID: ${run.id}
                        - Status: ${run.status}
                        - Conclusion: ${run.conclusion}
                        - URL: ${run.html_url}
                        """

                        def jobs = sh(script: """
                            curl -s -H "Authorization: token ${env.GITHUB_TOKEN}" \\
                                -H "Accept: application/vnd.github.v3+json" \\
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/runs/${run.id}/jobs
                        """, returnStdout: true).trim()

                        def frontendJob = readJSON(text: jobs).jobs.find { it.name == 'frontend' }
                        def backendJob = readJSON(text: jobs).jobs.find { it.name == 'backend' }

                        if (frontendJob?.conclusion != 'success' || backendJob?.conclusion != 'success') {
                            error "Tests failed: Frontend=${frontendJob?.conclusion}, Backend=${backendJob?.conclusion}"
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('sq1') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                            -Dsonar.projectKey=DevMinds_4TWIN5_pidev \
                            -Dsonar.projectName=DevMinds_4TWIN5_pidev \
                            -Dsonar.sources=Backend/Controllers \
                            -Dsonar.tests=Backend/tests,Backend/test
                        """
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontendReact') {
                    sh 'npm install'
                    sh 'npm run build' 
                    script {
                        if (!fileExists('dist/index.html')) {
                            error "Frontend build failed - missing dist/index.html"
                        }
                    }
                }
            }
        }

        stage('Validate Backend Package') {
            steps {
                dir('Backend') {
                    script {
                        if (!fileExists('package.json')) {
                            error "package.json not found in Backend directory!"
                        }
                        
                        def packageJson = readJSON file: 'package.json'
                        
                        if (!packageJson.name || !packageJson.version) {
                            error "package.json must contain both 'name' and 'version' fields!"
                        }
                        
                        echo "Backend package validated: ${packageJson.name}@${packageJson.version}"
                    }
                }
            }
        }

        stage('Package Backend') {
            steps {
                dir('Backend') {
                    sh 'npm install'
                    sh 'npm pack' 
                    script {
                        if (!fileExists("${packageJson.name}-${packageJson.version}.tgz")) {
                            error "npm pack failed to create .tgz file"
                        }
                    }
                }
            }
        }

        stage('Publish to Nexus') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-credentials',
                        usernameVariable: 'NEXUS_USER',
                        passwordVariable: 'NEXUS_PASS'
                    )]) {
                        // Create directory structure in Nexus
                        sh """
                            curl -X MKCOL -u ${env.NEXUS_USER}:${env.NEXUS_PASS} \
                                "${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/frontend/${env.BUILD_VERSION}/" || true
                            curl -X MKCOL -u ${env.NEXUS_USER}:${env.NEXUS_PASS} \
                                "${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/backend/${env.BUILD_VERSION}/" || true
                        """

                        // Upload Frontend
                        dir('frontendReact') {
                            sh """
                                tar -czvf ../frontend-${env.BUILD_VERSION}.tar.gz -C dist .
                                curl -f -v -u ${env.NEXUS_USER}:${env.NEXUS_PASS} \\
                                    --upload-file ../frontend-${env.BUILD_VERSION}.tar.gz \\
                                    "${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/frontend/${env.BUILD_VERSION}/"
                            """
                        }

                        // Upload Backend
                        dir('Backend') {
                            def packageJson = readJSON file: 'package.json'
                            def tgzFile = "${packageJson.name}-${packageJson.version}.tgz"
                            
                            sh """
                                curl -f -v -u ${env.NEXUS_USER}:${env.NEXUS_PASS} \\
                                    --upload-file ${tgzFile} \\
                                    "${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/backend/${env.BUILD_VERSION}/"
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/dist/**,**/*.tgz,**/*.tar.gz', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo "Pipeline succeeded! Artifacts published to Nexus:"
            echo "Frontend: ${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/frontend/${env.BUILD_VERSION}/"
            echo "Backend: ${env.NEXUS_URL}/repository/${env.NEXUS_REPO}/backend/${env.BUILD_VERSION}/"
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
            script {
                // Additional failure diagnostics
                if (env.NEXUS_URL) {
                    echo "Verify Nexus accessibility:"
                    sh "curl -I ${env.NEXUS_URL} || true"
                }
            }
        }
    }
}