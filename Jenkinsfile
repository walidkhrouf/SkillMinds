pipeline {
    agent any
    tools {
        nodejs 'NodeJS' // Ensure 'NodeJS' is configured with version 20.x
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    credentialsId: 'github-token', 
                    url: 'https://github.com/Saif-Hlaimi/DevMinds_4TWIN5_pidev.git'
            }
        }
        stage('Check GitHub Actions Test Results') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        // Fetch the latest workflow run for the CI workflow
                        def response = sh(script: """
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \
                                -H "Accept: application/vnd.github.v3+json" \
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/workflows/ci.yml/runs?per_page=1
                        """, returnStdout: true).trim()

                        // Parse the JSON response
                        def json = readJSON text: response
                        def run = json.workflow_runs[0]

                        // Check if there are any runs
                        if (!run) {
                            error 'No GitHub Actions workflow runs found for CI workflow. Ensure ci.yml has run on main.'
                        }

                        // Extract run details
                        def runStatus = run.status // e.g., "completed"
                        def runConclusion = run.conclusion // e.g., "success", "failure"
                        def runId = run.id
                        def runUrl = run.html_url

                        echo "GitHub Actions Workflow Run ID: ${runId}"
                        echo "Status: ${runStatus}"
                        echo "Conclusion: ${runConclusion}"
                        echo "Run URL: ${runUrl}"

                        // Fetch job details to get frontend and backend job results
                        def jobsResponse = sh(script: """
                            curl -s -H "Authorization: token \${GITHUB_TOKEN}" \
                                -H "Accept: application/vnd.github.v3+json" \
                                https://api.github.com/repos/Saif-Hlaimi/DevMinds_4TWIN5_pidev/actions/runs/${runId}/jobs
                        """, returnStdout: true).trim()

                        def jobsJson = readJSON text: jobsResponse
                        def jobs = jobsJson.jobs

                        // Check frontend and backend job results
                        def frontendJob = jobs.find { it.name == 'frontend' }
                        def backendJob = jobs.find { it.name == 'backend' }

                        echo "Frontend Job Conclusion: ${frontendJob?.conclusion ?: 'Not found'}"
                        echo "Backend Job Conclusion: ${backendJob?.conclusion ?: 'Not found'}"

                        // Fail the pipeline if either job failed
                        if (frontendJob?.conclusion != 'success' || backendJob?.conclusion != 'success') {
                            error "GitHub Actions tests failed: Frontend=${frontendJob?.conclusion}, Backend=${backendJob?.conclusion}"
                        }
                    }
                }
            }
        }
        stage('SonarQube Analysis') {
            steps {
                script {
                    // Configure SonarQube environment
                    withSonarQubeEnv('sq1') { // 'sq1' corresponds to the SonarQube configuration in Jenkins
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=DevMinds_4TWIN5_pidev \
                              -Dsonar.projectName=DevMinds_4TWIN5_pidev \
                              -Dsonar.sources=Backend/src \
                              -Dsonar.tests=Backend/tests
                        '''
                    }
                }
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'frontendReact/dist/**,Backend/dist/**', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}