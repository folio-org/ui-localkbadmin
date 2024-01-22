import { useState } from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { useQuery } from 'react-query';
import arrayMutators from 'final-form-arrays';

import { useStripes, useOkapiKy } from '@folio/stripes/core';
import { Button, Col, Icon, KeyValue, NoValue, Pane, PaneHeader, Row, List, ConfirmationModal } from '@folio/stripes/components';

import { ST_ENDPOINT } from '../../../../constants/endpoints';
import ProxyServerSettingsForm from '../ProxyServerSettingsForm/ProxyServerSettingsForm';
import ProxyServerSettingsFormModal from '../ProxyServerSettingsFormModal/ProxyServerSettingsFormModal';

const EDITING = 'edit';
const VIEWING = 'view';

const ProxyServerSettingsView = ({
  proxyServerSettingsId,
  stringTemplates,
  platforms,
  onDelete,
  onClose,
  onSave,
  onEditCancel,
  onSubmit
}) => {
  const stripes = useStripes();
  const perm = stripes.hasPerm('ui-local-kb-admin.proxyServer.manage');
  const [mode, setMode] = useState(VIEWING);
  const [deleteModal, setDeleteModal] = useState(false);
  const ky = useOkapiKy();

  const { data: proxyServerSettings = {} } = useQuery(
    ['ERM', 'STs', ST_ENDPOINT(proxyServerSettingsId)],
    () => ky.get(ST_ENDPOINT(proxyServerSettingsId)).json()
  );

  const { idScopes = [] } = platforms;
  const idScopeValues = isEmpty(idScopes) ? [''] : idScopes.map(ids => ids.value);

  const getActionMenu = ({ onToggle }) => {
    const actionsArray = [];
    if (perm) {
      actionsArray.push(
        <>
          <Button
            key={`${proxyServerSettings?.name}-action-edit`}
            buttonStyle="dropdownItem"
            data-test-proxy-server-settings-edit
            marginBottom0
            onClick={() => setMode(EDITING)}
          >
            <Icon icon="edit">
              <FormattedMessage id="stripes-core.button.edit" />
            </Icon>
          </Button>
          <Button
            key={`${proxyServerSettings?.name}-action-delete`}
            buttonStyle="dropdownItem"
            data-test-proxy-server-settings-delete
            marginBottom0
            onClick={() => {
              setDeleteModal(true);
              onToggle();
            }}
          >
            <Icon icon="trash">
              <FormattedMessage id="stripes-core.button.delete" />
            </Icon>
          </Button>
        </>
      );
    }
    return (actionsArray?.length ? actionsArray : null);
  };

  const renderViewHeader = renderProps => (
    <PaneHeader
      {...renderProps}
      actionMenu={getActionMenu}
      dismissible
      onClose={onClose}
      paneTitle={proxyServerSettings?.name}
    />
  );

  return (
    <>
      <Pane
        defaultWidth="fill"
        id="settings-proxyServerSettings-viewPane"
        renderHeader={renderViewHeader}
      >
        <Row>
          <Col xs={12}>
            <KeyValue
              data-test-proxy-server-setting-name
              label={<FormattedMessage id="ui-local-kb-admin.settings.proxyServerSettings.name" />}
              value={proxyServerSettings.name}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <KeyValue
              data-test-proxy-server-setting-url
              label={<FormattedMessage id="ui-local-kb-admin.settings.proxyServerSettings.urlCustomizationCode" />}
              value={proxyServerSettings?.rule ?? <NoValue />}
            />
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <KeyValue label={<FormattedMessage id="ui-local-kb-admin.settings.proxyServerSettings.platformsToExclude" />}>
              <List
                items={idScopeValues?.map(ids => ids.label)}
                listStyle="bullets"
              />
            </KeyValue>
          </Col>
        </Row>
      </Pane>
      {deleteModal && (
        <ConfirmationModal
          buttonStyle="danger"
          confirmLabel={<FormattedMessage id="ui-local-kb-admin.settings.proxyServerSettings.delete.confirmLabel" />}
          data-test-confirmationModal
          heading={<FormattedMessage id="ui-local-kb-admin.settings.proxyServerSettings.delete.confirmHeading" />}
          id="delete-proxy-server-settings-confirmation"
          message={<FormattedMessage id="ui-local-kb-admin.settings.proxyServerSettings.delete.confirmMessage" values={{ name: proxyServerSettings?.name }} />}
          onCancel={() => setDeleteModal(false)}
          onConfirm={() => {
            onDelete(proxyServerSettings?.id);
            onClose();
            setDeleteModal(false);
          }}
          open={deleteModal}
        />
      )}
      <ProxyServerSettingsFormModal
        initialValues={mode === EDITING ? { ...proxyServerSettings } : {}}
        modalProps={{
          dismissible: true,
          label: <FormattedMessage id="ui-local-kb-admin.settings.proxyServerSettings.editProxyServerSetting" />,
          onClose: () => setMode(VIEWING),
          open: (mode === EDITING)
        }}
        mutators={{ ...arrayMutators }}
        onCancel={onEditCancel}
        onDelete={onDelete}
        onSave={onSave}
        onSubmit={onSubmit}
      >
        <ProxyServerSettingsForm
          platforms={platforms}
          stringTemplates={stringTemplates}
        />
      </ProxyServerSettingsFormModal>
    </>
  );
};

ProxyServerSettingsView.propTypes = {
  proxyServerSettingsId: PropTypes.arrayOf(PropTypes.object),
  stringTemplates: PropTypes.arrayOf(PropTypes.object),
  platforms: PropTypes.arrayOf(PropTypes.object),
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
  onEditCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ProxyServerSettingsView;
