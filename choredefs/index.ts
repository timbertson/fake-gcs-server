import { run } from './deps/cmd.ts'
import * as Workflow from './deps/workflow.ts'
import * as Docker from './deps/docker.ts'
import * as Render from './deps/render.ts'

function dockerChores() {
	return {
		async login(opts: { user: string, token: string }) {
			await run([
				'docker', 'login', 'ghcr.io', '-u', opts.user, '--password-stdin'
			], { stdin: { contents: opts.token } })
		},

		async build(opts: { push?: boolean }) {
			await Docker.build({
				tags: [{
					url: 'ghcr.io/timbertson/fake-gcs-server'
				}],
				stage: null,
				push: opts.push
			})
		},
	}
}

function files(): Render.File[] {
	return [
		new Render.YAMLFile('.github/workflows/docker.yml', {
			on: {
				workflow_dispatch: {},
				push: {
					branches: [ 'docker' ],
				},
			},
			jobs: {
				docker: {
					'runs-on': 'ubuntu-latest',
					steps: Workflow.chores([
						{ module: 'docker', name: 'login', opts: { user: Workflow.expr('github.actor'), token: Workflow.secret('GITHUB_TOKEN') } },
						{ module: 'docker', name: 'build' },
						{ name: 'ci', opts: { docker: true } },
					]),
				}
			},
		}),
	]
}

export default {
	docker: dockerChores(),

	async render(_: {}) {
		await Render.render(files())
	},
}
