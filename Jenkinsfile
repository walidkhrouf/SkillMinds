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

        stage('Verify Tools') {
            steps {
                script {
                    // Verify tar is available
                    def tarAvailable = sh(script: 'command -v tar || true', returnStatus: true) == 0
                    if (!tarAvailable) {
                        error "ERROR: tar command not found. This is required for packaging."
                    }
                    echo "tar command is available"
                }
            }
        }

        stage('Check GitHub Actions') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        def response = sh(script: """
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \\
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
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \\
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
                }
            }
        }

        stage('Test Prometheus Metrics') {
            steps {
                script {
                    def prometheus_url = 'http://192.168.33.10:9090/targets'
                    def query = 'up{job="jenkins"}'
                    def response = sh(script: "curl -s '${prometheus_url}?query=${URLEncoder.encode(query, 'UTF-8')}'", returnStdout: true)
                    echo "Prometheus Response: ${response}"
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
                        // Frontend (using tar)
                        sh """
                            if [ -d "frontendReact/dist" ]; then
                                echo "Packaging frontend files..."
                                tar -czvf frontend-${BUILD_VERSION}.tar.gz -C frontendReact/dist .
                                echo "Uploading frontend package to Nexus..."
                                curl -v -f -u \$NEXUS_USER:\$NEXUS_PASS \\
                                    --upload-file frontend-${BUILD_VERSION}.tar.gz \\
                                    "\$NEXUS_URL/repository/\$NEXUS_REPO/com/devminds/frontend/${BUILD_VERSION}/frontend-${BUILD_VERSION}.tar.gz" || {
                                        echo "ERROR: Failed to upload frontend package to Nexus"
                                        exit 1
                                    }
                                echo "Frontend package uploaded successfully"
                            else
                                echo "ERROR: frontendReact/dist not found!"
                                exit 1
                            fi
                        """

                        // Backend (using npm pack)
                        sh """
                            if ls Backend/*.tgz 1> /dev/null 2>&1; then
                                echo "Found backend package..."
                                TGZ_FILE=\$(ls Backend/*.tgz | head -1)
                                BASE_NAME=\$(basename \$TGZ_FILE .tgz)
                                VERSION=\$(echo \$BASE_NAME | sed 's/.*-//')-${BUILD_VERSION}
                                echo "Uploading backend package to Nexus..."
                                curl -v -f -u \$NEXUS_USER:\$NEXUS_PASS \\
                                    --upload-file \$TGZ_FILE \\
                                    "\$NEXUS_URL/repository/\$NEXUS_REPO/com/devminds/backend/\${VERSION}/backend-\${VERSION}.tgz" || {
                                        echo "ERROR: Failed to upload backend package to Nexus"
                                        exit 1
                                    }
                                echo "Backend package uploaded successfully"
                            else
                                echo "ERROR: No .tgz file found in Backend/"
                                exit 1
                            fi
                        """
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
            echo "Frontend: ${NEXUS_URL}/repository/${NEXUS_REPO}/com/devminds/frontend/${BUILD_VERSION}/frontend-${BUILD_VERSION}.tar.gz"
            echo "Backend: ${NEXUS_URL}/repository/${NEXUS_REPO}/com/devminds/backend/"
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
        }
    }
}