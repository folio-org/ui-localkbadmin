import React from 'react';
import compose from 'compose-function';
import PropTypes from 'prop-types';
import { stripesConnect } from '@folio/stripes/core';
import { Callout } from '@folio/stripes/components';
import withFileHandlers from './components/withFileHandlers';
import View from '../components/views/JobForm';
import showToast from './components/showToast';

class JobCreateRoute extends React.Component {
  static manifest = Object.freeze({
    jobs: {
      type: 'okapi',
      path: (_q, params) => {
        const format = params?.format;
        let endpointPath;
        if (format === 'KBART') {
          endpointPath = 'erm/jobs/kbartImport';
        } else {
          endpointPath = 'erm/jobs/packageImport';
        }
        return endpointPath;
      },
      fetch: false,
      shouldRefresh: () => false,
    },
  });

  static propTypes = {
    handlers: PropTypes.object,
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
      replace: PropTypes.func,
    }).isRequired,
    location: PropTypes.shape({
      search: PropTypes.string.isRequired,
    }).isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({
        format: PropTypes.string,
      }),
    }),
    mutator: PropTypes.shape({
      jobs: PropTypes.shape({
        POST: PropTypes.func.isRequired,
      }).isRequired,
    }).isRequired,
  };

  static defaultProps = {
    handlers: {},
  }

  constructor(props) {
    super(props);

    this.callout = React.createRef();
  }

  handleClose = () => {
    const { location } = this.props;
    this.props.history.push(`/local-kb-admin${location.search}`);
  }

  handleSubmit = (job) => {
    const { history, location, mutator } = this.props;
    let jobName = '';
    let jobId = '';
    let jobClass = '';

    mutator.jobs
      .POST(job)
      .then(response => {
        jobName = response?.name ?? '';
        jobId = response?.id ?? '';
        jobClass = response?.class ?? '';

        //TODO This DOESN'T WORK yet
        this.callout.current.sendCallout(showToast('ui-local-kb-admin.job.created.success', jobClass, 'success', { name: jobName }));

        history.push(`/local-kb-admin/${jobId}${location.search}`);
      });
  }

  render() {
    const { handlers, match: { params: { format } } } = this.props;

    return (
      <>
        <View
          handlers={{
            ...handlers,
            onClose: this.handleClose
          }}
          onSubmit={this.handleSubmit}
          format={format}
        />
        <Callout ref={this.callout} />
      </>
    );
  }
}

export default compose(
  withFileHandlers,
  stripesConnect
)(JobCreateRoute);
